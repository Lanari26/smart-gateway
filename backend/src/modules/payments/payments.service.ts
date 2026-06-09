import { randomBytes, randomUUID } from 'node:crypto';
import { TransactionStatus, type Transaction } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/http-error.js';
import { avatarLetter, formatDateTime } from '../../lib/format.js';
import { env } from '../../env.js';
import {
  checkMomoStatus,
  detectProvider,
  requestCardPayment,
  requestMomoPayment,
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
    date: formatDateTime(t.createdAt),
    createdAt: t.createdAt,
  };
}

function generateReference(): string {
  return `tx_${randomBytes(4).toString('hex')}`;
}

const isTerminal = (s: TransactionStatus) => s === TransactionStatus.PAID || s === TransactionStatus.FAILED;

// ── MoMo: request a charge then auto-poll until it settles ────────────────────
export async function createMomoCharge(input: MomoChargeInput, merchantId: string | null) {
  const provider: MomoProvider = input.provider ?? detectProvider(input.phone);
  const reqRef = randomUUID();

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
      // Accepted requests sit PENDING until the payer approves; a rejected
      // request is FAILED immediately so the UI stops polling.
      status: result.ok ? TransactionStatus.PENDING : TransactionStatus.FAILED,
    },
  });

  if (!result.ok) {
    return { transaction: toDTO(tx), accepted: false, message: result.message ?? 'The gateway rejected the payment request.' };
  }

  // Fire-and-forget background poller; the status endpoint is the source of
  // truth, but this guarantees the ledger settles even if no one is watching.
  void startStatusPolling(reqRef, provider);

  return { transaction: toDTO(tx), accepted: true };
}

// ── Status: live verify against ITECpay, persisted idempotently ───────────────
async function syncStatus(tx: Transaction): Promise<Transaction> {
  // Only Mobile Money charges are verifiable via /api2/verify; card charges
  // settle on the hosted page and carry a PCODE rather than a req_ref.
  if (isTerminal(tx.status) || !tx.providerRef || (tx.provider !== 'MTN' && tx.provider !== 'AIRTEL')) {
    return tx;
  }

  const { status, transactionId } = await checkMomoStatus(tx.providerRef, tx.provider as MomoProvider);
  const next = LEDGER_STATUS[status];
  if (next === tx.status && !transactionId) return tx;

  return prisma.transaction.update({
    where: { id: tx.id },
    data: { status: next, providerTxnId: transactionId ?? tx.providerTxnId },
  });
}

export async function getChargeStatus(reference: string) {
  const tx = await prisma.transaction.findUnique({ where: { reference } });
  if (!tx) throw HttpError.notFound('Transaction not found');
  const synced = await syncStatus(tx);
  return toDTO(synced);
}

/**
 * Poll the verify endpoint on a fixed cadence until the charge reaches a
 * terminal status (SUCCESSFUL/FAILED) or we exhaust the attempt budget.
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
    return; // settled.
  }
  console.warn(`[payments] charge ${reqRef} still pending after max attempts; leaving as PENDING.`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      status: TransactionStatus.PENDING,
    },
  });

  return { transaction: toDTO(tx), link: result.link, validUntil: result.validUntil };
}
