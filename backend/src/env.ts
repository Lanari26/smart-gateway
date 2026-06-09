import { z } from 'zod';

/**
 * Validated, typed environment. Fails fast at boot if required vars are missing
 * so we never run a half-configured server.
 */
/** A string env var that falls back to `fallback` when unset OR blank (""). */
const blankable = (fallback: string) =>
  z.preprocess((v) => (v === undefined || v === '' ? undefined : v), z.string().default(fallback));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Comma-separated list of allowed frontend origins.
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // ── ITECpay gateway (https://pay.itecpay.rw) ──────────────────────────────
  // Provider API keys issued at registration. Defaults are the project's live
  // keys so the gateway works out of the box; override per-environment. Blank
  // values (common when Docker injects unset vars as "") fall back to defaults.
  ITECPAY_BASE_URL: blankable('https://pay.itecpay.rw'),
  ITECPAY_KEY_MTN: blankable('eGx562IiN7y31CmZCnYgFcG5Tohg9ZDaAcV6qg2w0K/Z5qMlE1SaZMMAxxePxBokywS9hMqe+mDCa9xMLoYOjw=='),
  ITECPAY_KEY_AIRTEL: blankable('eGx562IiN7y31CmZCnYgFdyWsMy2BFOf3203sHbDGXcX5znyNCpNWNLw1XyKuA8vHsMmAfCPWMUGT/DPH1mIbg=='),
  ITECPAY_KEY_CARD: blankable('eGx562IiN7y31CmZCnYgFQeE2M4aADpbE4pIMZz0i/hhP3l6KB7LnNo5ICTWKcoreSFLjBej5DTGGnfTwmkSnA=='),

  // Status polling cadence: check every interval, give up after max attempts
  // (the charge stays PENDING — the customer simply never approved).
  ITECPAY_POLL_INTERVAL_MS: z.coerce.number().default(4000),
  ITECPAY_POLL_MAX_ATTEMPTS: z.coerce.number().default(45),

  // How long POST /payments/momo blocks waiting for the payer to approve the
  // USSD prompt before returning. Kept under the typical 60s reverse-proxy
  // read timeout; if approval takes longer the response comes back `pending`
  // and the caller polls /payments/:reference/status (the background poller
  // keeps settling regardless).
  ITECPAY_SYNC_WAIT_MS: z.coerce.number().default(50000),

  // Provider cut taken off every collection. The distributable (transferable)
  // amount is amount − this %. Defaults to 4%.
  ITECPAY_FEE_PERCENT: z.coerce.number().min(0).max(100).default(4),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
