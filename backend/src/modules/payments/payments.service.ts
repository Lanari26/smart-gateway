import { randomBytes, randomUUID } from 'node:crypto';
import { Prisma, TransactionStatus, type Transaction } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/http-error.js';
import { avatarLetter, formatDateTime } from '../../lib/format.js';
import { env } from '../../env.js';
import {
  checkMomoStatus,
  detectProvider,
  requestCardPayment,
  requestMomoPayment,
  requestTransfer,
  type ItecPayStatus,
  type MomoProvider,
} from './itecpay.js';
import type { CardChargeInput, MomoChargeInput } from './payments.schemas.js';

const DTO_STATUS: Record<TransactionStatus, 'paid' | 'pending' | 'failed'> = {
  PAID: 'paid',
  PENDING: 'pending',
  FAILED: 'failed',
};

// ITECpay's verify status → our ledger status.
const LEDGER_STATUS: Record<ItecPayStatus, TransactionStatus> = {
  SUCCESSFUL: TransactionStatus.PAID,
  FAILED: TransactionStatus.FAILED,
  PENDING: TransactionStatus.PENDING,
};

/** A computed split-payout line, persisted on the transaction as JSON. */
interface RecipientRow {
  phone: string;
  percent: number;
  amount: number; // RWF this number receives (floor of percent × net)
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'SKIPPED';
  transId?: string;
  message?: string;
}

/** Human-readable summary of where a charge is in its lifecycle. */
function statusMessage(t: Transaction): string {
  if (t.status === TransactionStatus.PENDING) return 'Payment pending — awaiting approval.';
  if (t.status === TransactionStatus.FAILED) return 'Payment failed.';
  switch (t.transferStatus) {
    case 'SUCCESSFUL':
      return 'Payment successful, transfer successful.';
    case 'PARTIAL':
      return 'Payment successful, some transfers failed.';
    case 'FAILED':
      return 'Payment successful, transfer failed.';
    case 'PENDING':
    case 'PROCESSING':
      return 'Payment successful, transfer in progress…';
    default:
      return 'Payment successful.'; // NONE / null — no split requested
  }
}

function toDTO(t: Transaction) {
  return {
    id: t.id,
    reference: t.reference,
    customerName: t.customerName,
    customerEmail: t.customerEmail,
    avatarLetter: avatarLetter(t.customerName),
    amount: t.amount,
    currency: t.currency,
    method: t.method,
    provider: t.provider,
    status: DTO_STATUS[t.status],
    feePercent: t.feePercent,
    netAmount: t.netAmount,
    transferStatus: t.transferStatus,
    recipients: t.recipients,
    message: statusMessage(t),
    date: formatDateTime(t.createdAt),
    createdAt: t.createdAt,
  };
}

function generateReference(): string {
  return `tx_${randomBytes(4).toString('hex')}`;
}

const isTerminal = (s: TransactionStatus) => s === TransactionStatus.PAID || s === TransactionStatus.FAILED;
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ── MoMo: request a charge → auto-poll → auto-disburse on success ─────────────
export async function createMomoCharge(input: MomoChargeInput, merchantId: string | null) {
  const provider: MomoProvider = input.provider ?? detectProvider(input.phone);
  const reqRef = randomUUID();

  // Provider takes its cut off the gross; only the remainder is distributable.
  const feePercent = env.ITECPAY_FEE_PERCENT;
  const netAmount = Math.round(input.amount * (1 - feePercent / 100));
  const recipients: RecipientRow[] = (input.recipients ?? []).map((r) => ({
    phone: r.phone,
    percent: r.percent,
    amount: Math.floor((netAmount * r.percent) / 100),
    status: 'PENDING',
  }));

  const result = await requestMomoPayment({
    amount: input.amount,
    phone: input.phone,
    provider,
    reqRef,
    note: input.note,
    message: input.message,
  });

  const tx = await prisma.transaction.create({
    data: {
      reference: generateReference(),
      merchantId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      amount: input.amount,
      method: `Mobile Money (${provider})`,
      phone: input.phone,
      provider,
      providerRef: reqRef,
      providerTxnId: result.transId,
      feePercent,
      netAmount,
      recipients: recipients as unknown as Prisma.InputJsonValue,
      // PENDING transfer means "disburse once paid"; NONE means no split.
      transferStatus: recipients.length ? 'PENDING' : 'NONE',
      // Accepted requests sit PENDING until the payer approves; a rejected
      // request is FAILED immediately so the UI stops polling.
      status: result.ok ? TransactionStatus.PENDING : TransactionStatus.FAILED,
    },
  });

  if (!result.ok) {
    return { transaction: toDTO(tx), accepted: false, message: result.message ?? 'The gateway rejected the payment request.' };
  }

  // Fire-and-forget orchestrator: poll the verify endpoint until the charge
  // settles, then disburse to the recipients. The status endpoint mirrors this
  // so progress is visible even if this process restarts.
  void startStatusPolling(reqRef, provider);

  return { transaction: toDTO(tx), accepted: true };
}

// ── Status: live verify against ITECpay, persisted idempotently ───────────────
async function syncStatus(tx: Transaction): Promise<Transaction> {
  // Only Mobile Money charges are verifiable via /api2/verify; card charges
  // settle on the hosted page and carry a PCODE rather than a req_ref.
  if (!isTerminal(tx.status) && tx.providerRef && (tx.provider === 'MTN' || tx.provider === 'AIRTEL')) {
    const { status, transactionId } = await checkMomoStatus(tx.providerRef, tx.provider as MomoProvider);
    const next = LEDGER_STATUS[status];
    if (next !== tx.status || transactionId) {
      await prisma.transaction.updateMany({
        where: { id: tx.id, status: TransactionStatus.PENDING },
        data: { status: next, providerTxnId: transactionId ?? tx.providerTxnId },
      });
    }
  }

  const fresh = (await prisma.transaction.findUnique({ where: { id: tx.id } }))!;
  // Kick off disbursement if the charge is paid and a split is still pending.
  // Fire-and-forget so the status request stays responsive; runTransfers is
  // idempotent (atomic claim) so the poller and this can't double-pay.
  if (fresh.status === TransactionStatus.PAID && fresh.transferStatus === 'PENDING') {
    void runTransfers(fresh.id);
  }
  return fresh;
}

export async function getChargeStatus(reference: string) {
  const tx = await prisma.transaction.findUnique({ where: { reference } });
  if (!tx) throw HttpError.notFound('Transaction not found');
  const synced = await syncStatus(tx);
  return toDTO(synced);
}

/**
 * Poll the verify endpoint on a fixed cadence until the charge reaches a
 * terminal status (SUCCESSFUL/FAILED) or we exhaust the attempt budget; on
 * success, disburse to the recipients.
 */
async function startStatusPolling(reqRef: string, provider: MomoProvider): Promise<void> {
  for (let attempt = 0; attempt < env.ITECPAY_POLL_MAX_ATTEMPTS; attempt++) {
    await delay(env.ITECPAY_POLL_INTERVAL_MS);

    let result;
    try {
      result = await checkMomoStatus(reqRef, provider);
    } catch (err) {
      console.error(`[payments] status poll failed for ${reqRef}:`, err);
      continue; // transient gateway/network error — try again next tick.
    }

    if (result.status === 'PENDING') continue;

    await prisma.transaction.updateMany({
      where: { providerRef: reqRef, status: TransactionStatus.PENDING },
      data: { status: LEDGER_STATUS[result.status], providerTxnId: result.transactionId },
    });

    if (result.status === 'SUCCESSFUL') {
      const tx = await prisma.transaction.findFirst({ where: { providerRef: reqRef } });
      if (tx) await runTransfers(tx.id);
    }
    return; // settled.
  }
  console.warn(`[payments] charge ${reqRef} still pending after max attempts; leaving as PENDING.`);
}

/**
 * Disburse the net amount to the split recipients. Idempotent: an atomic
 * PENDING→PROCESSING claim guarantees exactly one caller runs the transfers,
 * so real money is never sent twice even under concurrent triggers.
 */
async function runTransfers(txId: string): Promise<void> {
  const claim = await prisma.transaction.updateMany({
    where: { id: txId, status: TransactionStatus.PAID, transferStatus: 'PENDING' },
    data: { transferStatus: 'PROCESSING' },
  });
  if (claim.count === 0) return; // already processed, in flight, or no split.

  const tx = await prisma.transaction.findUnique({ where: { id: txId } });
  if (!tx) return;
  const recipients = (tx.recipients as unknown as RecipientRow[]) ?? [];

  const results: RecipientRow[] = [];
  for (const r of recipients) {
    if (r.amount <= 0) {
      results.push({ ...r, status: 'SKIPPED' });
      continue;
    }
    try {
      const res = await requestTransfer({ amount: r.amount, phone: r.phone, provider: detectProvider(r.phone) });
      results.push({ ...r, status: res.ok ? 'SUCCESSFUL' : 'FAILED', transId: res.transId, message: res.message });
    } catch (err) {
      console.error(`[payments] transfer to ${r.phone} failed for ${txId}:`, err);
      results.push({ ...r, status: 'FAILED', message: 'transfer request error' });
    }
  }

  const attempted = results.filter((x) => x.status !== 'SKIPPED');
  const transferStatus =
    attempted.length === 0
      ? 'NONE'
      : attempted.every((x) => x.status === 'SUCCESSFUL')
        ? 'SUCCESSFUL'
        : attempted.some((x) => x.status === 'SUCCESSFUL')
          ? 'PARTIAL'
          : 'FAILED';

  await prisma.transaction.update({
    where: { id: txId },
    data: { transferStatus, recipients: results as unknown as Prisma.InputJsonValue },
  });
}

// ── Card: hand back a hosted payment link ─────────────────────────────────────
export async function createCardCharge(input: CardChargeInput, merchantId: string | null) {
  const result = await requestCardPayment({ amount: input.amount, email: input.email });
  if (!result.ok || !result.link) {
    throw HttpError.badRequest('The card gateway could not generate a payment link. Try again.');
  }

  const tx = await prisma.transaction.create({
    data: {
      reference: generateReference(),
      merchantId,
      customerName: input.customerName,
      customerEmail: input.email,
      amount: input.amount,
      method: 'Card',
      provider: 'CARD',
      providerRef: result.pcode,
      transferStatus: 'NONE',
      status: TransactionStatus.PENDING,
    },
  });

  return { transaction: toDTO(tx), link: result.link, validUntil: result.validUntil };
}
