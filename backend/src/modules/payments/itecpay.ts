// Thin client over the ITECpay gateway (https://pay.itecpay.rw).
// Implements exactly the three calls the SmartPay checkout needs:
//   • request a Mobile Money payment   → POST /api2/pay
//   • check a payment's status         → POST /api2/verify
//   • generate a hosted card-pay link  → POST /api/pay/apis/pesapal/generatecode
// See Credentials.md for the full API contract.
import { env } from '../../env.js';

export type MomoProvider = 'MTN' | 'AIRTEL';

/** Provider → API key. Card uses its own key. */
const KEY: Record<MomoProvider | 'CARD', string> = {
  MTN: env.ITECPAY_KEY_MTN,
  AIRTEL: env.ITECPAY_KEY_AIRTEL,
  CARD: env.ITECPAY_KEY_CARD,
};

/**
 * Guess the mobile-money network from a Rwandan MSISDN so we authenticate with
 * the matching key. Airtel ranges are 072/073; everything else (078/079) → MTN.
 */
export function detectProvider(phone: string): MomoProvider {
  const local = phone.replace(/\D/g, '').replace(/^250/, '');
  return /^07[23]/.test(local) ? 'AIRTEL' : 'MTN';
}

async function postJson(path: string, body: unknown): Promise<{ httpStatus: number; data: any }> {
  const res = await fetch(`${env.ITECPAY_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* gateway returned a non-JSON body */
  }
  return { httpStatus: res.status, data };
}

// ── 1.1  Request payment ─────────────────────────────────────────────────────
export interface MomoRequestArgs {
  amount: number;
  phone: string;
  provider: MomoProvider;
  reqRef: string;
  note?: string;
  message?: string;
}

export interface MomoRequestResult {
  ok: boolean;
  transId?: string;
  message?: string;
  raw: unknown;
}

export async function requestMomoPayment(args: MomoRequestArgs): Promise<MomoRequestResult> {
  const { httpStatus, data } = await postJson('/api2/pay', {
    amount: args.amount,
    phone: args.phone,
    key: KEY[args.provider],
    req_ref: args.reqRef,
    note: args.note,
    message: args.message,
  });

  // The gateway echoes its own outcome in `status`; 200 == accepted.
  const ok = (data?.status ?? httpStatus) === 200 && Boolean(data?.data?.transID);
  return {
    ok,
    transId: data?.data?.transID,
    message: data?.data?.message,
    raw: data,
  };
}

// ── 1.2  Payment status ──────────────────────────────────────────────────────
export type ItecPayStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export interface MomoStatusResult {
  status: ItecPayStatus;
  transactionId?: string;
  raw: unknown;
}

export async function checkMomoStatus(reqRef: string, provider: MomoProvider): Promise<MomoStatusResult> {
  const { data } = await postJson('/api2/verify', {
    action: 'status_check',
    req_ref: reqRef,
    key: KEY[provider],
  });

  const raw = String(data?.data?.status ?? '').toUpperCase();
  const status: ItecPayStatus =
    raw === 'SUCCESSFUL' || raw === 'SUCCESS' ? 'SUCCESSFUL' : raw === 'FAILED' || raw === 'FAILURE' ? 'FAILED' : 'PENDING';

  return { status, transactionId: data?.data?.transaction_id, raw: data };
}

// ── 1.3  Transfer / cashout (disburse to a wallet) ───────────────────────────
export interface TransferResult {
  ok: boolean;
  transId?: string;
  message?: string;
  raw: unknown;
}

export async function requestTransfer(args: { amount: number; phone: string; provider: MomoProvider }): Promise<TransferResult> {
  const { httpStatus, data } = await postJson('/api/transfer', {
    amount: args.amount,
    phone: args.phone,
    key: KEY[args.provider],
  });

  const ok = (data?.status ?? httpStatus) === 200;
  return {
    ok,
    transId: data?.data?.transID ?? data?.data?.transaction_id,
    message: data?.data?.message ?? data?.message,
    raw: data,
  };
}

// ── Card payment (hosted link) ───────────────────────────────────────────────
export interface CardRequestResult {
  ok: boolean;
  pcode?: string;
  link?: string;
  validUntil?: string;
  raw: unknown;
}

export async function requestCardPayment(args: { amount: number; email: string }): Promise<CardRequestResult> {
  const { httpStatus, data } = await postJson('/api/pay/apis/pesapal/generatecode', {
    amount: args.amount,
    email: args.email,
    key: KEY.CARD,
  });

  const ok = (data?.status ?? httpStatus) === 200 && Boolean(data?.link);
  return { ok, pcode: data?.PCODE, link: data?.link, validUntil: data?.valid_until, raw: data };
}
