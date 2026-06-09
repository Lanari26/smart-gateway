#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// SmartPay Gateway — LIVE payment test
//
// Exercises the real ITECpay gateway end-to-end: request a payment, then poll
// the status until it settles SUCCESSFUL or FAILED — exactly the lifecycle the
// checkout relies on. No mocks, no local DB; everything hits live services.
//
// Two modes:
//   gateway (default) — drives our deployed API (/payments/momo + status).
//                       Validates the whole chain incl. persistence & polling.
//   direct            — calls ITECpay directly (/api2/pay + /api2/verify).
//                       Useful to confirm the keys / request body in isolation.
//
// Usage (run on the server):
//   node backend/scripts/live-test.mjs --phone 0788000000 --amount 100 --key sk_test_xxx
//   node backend/scripts/live-test.mjs --mode direct --phone 0788000000 --amount 100
//   API=https://api-pay.lanari.rw/api API_KEY=sk_... node backend/scripts/live-test.mjs --phone 07...
//
// gateway mode needs --key (or API_KEY env) — the /payments endpoints require an
// API key; mint one in the console Developers tab. direct mode talks to ITECpay
// itself and uses the provider keys instead.
//
// Flags: --mode --api --key --phone --amount --provider --note --interval --max --json
// Exits 0 only when the payment reaches SUCCESSFUL.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto';

const args = parseArgs(process.argv.slice(2));

const MODE = args.mode || 'gateway';
const API = (args.api || process.env.API || 'http://127.0.0.1:4000/api').replace(/\/$/, '');
const ITEC_BASE = (args.itecBase || process.env.ITECPAY_BASE_URL || 'https://pay.itecpay.rw').replace(/\/$/, '');
const PHONE = args.phone || process.env.TEST_PHONE;
const AMOUNT = Number(args.amount || process.env.TEST_AMOUNT || 100);
const API_KEY = args.key || process.env.API_KEY; // required in gateway mode
// Split payout, e.g. --recipients "0788111111:60,0738222222:40"
const RECIPIENTS = parseRecipients(args.recipients || process.env.RECIPIENTS);

function parseRecipients(spec) {
  if (!spec || spec === true) return undefined;
  const list = String(spec)
    .split(',')
    .map((part) => {
      const [phone, percent] = part.split(':');
      return { phone: phone?.trim(), percent: Number(percent) };
    })
    .filter((r) => r.phone && r.percent > 0);
  return list.length ? list : undefined;
}
const PROVIDER = args.provider; // MTN | AIRTEL (optional; auto-detected otherwise)
const NOTE = args.note || `live-test-${Date.now()}`;
const INTERVAL = Number(args.interval || 4000);
const MAX = Number(args.max || 45);

// Direct-mode keys (defaults match the project's registered keys, same as the backend).
const KEY = {
  MTN: process.env.ITECPAY_KEY_MTN || 'eGx562IiN7y31CmZCnYgFcG5Tohg9ZDaAcV6qg2w0K/Z5qMlE1SaZMMAxxePxBokywS9hMqe+mDCa9xMLoYOjw==',
  AIRTEL: process.env.ITECPAY_KEY_AIRTEL || 'eGx562IiN7y31CmZCnYgFdyWsMy2BFOf3203sHbDGXcX5znyNCpNWNLw1XyKuA8vHsMmAfCPWMUGT/DPH1mIbg==',
};

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    }
  }
  return out;
}

function detectProvider(phone) {
  const local = String(phone).replace(/\D/g, '').replace(/^250/, '');
  return /^07[23]/.test(local) ? 'AIRTEL' : 'MTN';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...m) => console.log(...m);

async function postJson(url, body, extraHeaders = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { httpStatus: res.status, data };
}

async function getJson(url) {
  const res = await fetch(url);
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { httpStatus: res.status, data };
}

function done(ok, summary) {
  if (args.json) log(JSON.stringify(summary, null, 2));
  log('');
  log(ok ? '✅ LIVE TEST PASSED' : '❌ LIVE TEST FAILED', `— final status: ${summary.status}`);
  process.exit(ok ? 0 : 1);
}

// ── gateway mode: drive our deployed API ─────────────────────────────────────
async function runGateway() {
  if (!API_KEY) {
    console.error('Missing --key (or API_KEY env): the /payments endpoints require an API key. Mint one in the console (Developers tab).');
    process.exit(2);
  }
  log(`▶ gateway mode  API=${API}  phone=${PHONE}  amount=${AMOUNT} RWF  key=${String(API_KEY).split('_').slice(0, 2).join('_')}_…`);

  if (RECIPIENTS) log(`  split payout: ${RECIPIENTS.map((r) => `${r.phone}=${r.percent}%`).join(', ')}`);

  const init = await postJson(
    `${API}/payments/momo`,
    {
      customerName: 'Live Test',
      customerEmail: 'live-test@smartpay.rw',
      phone: PHONE,
      amount: AMOUNT,
      provider: PROVIDER,
      note: NOTE,
      recipients: RECIPIENTS,
    },
    { 'X-API-Key': API_KEY },
  );

  if (init.httpStatus !== 201) {
    return done(false, { stage: 'request', status: 'REQUEST_REJECTED', httpStatus: init.httpStatus, body: init.data });
  }
  const tx = init.data?.transaction;
  const reference = tx?.reference;
  log(`  charge created: reference=${reference} accepted=${init.data?.accepted} status=${tx?.status}`);
  if (!init.data?.accepted || !reference) {
    return done(false, { stage: 'request', status: 'NOT_ACCEPTED', body: init.data });
  }

  log(`  polling /payments/${reference}/status every ${INTERVAL}ms (max ${MAX})…`);
  log(`  → approve the prompt on ${PHONE} now.`);

  for (let attempt = 1; attempt <= MAX; attempt++) {
    await sleep(INTERVAL);
    const { httpStatus, data } = await getJson(`${API}/payments/${reference}/status`);
    const t = data?.transaction ?? {};
    log(`    [${attempt}/${MAX}] http=${httpStatus} status=${t.status} transfer=${t.transferStatus ?? '-'}  ${t.message ?? ''}`);

    if (t.status === 'failed') return done(false, { reference, status: 'FAILED', transaction: t });
    if (t.status === 'paid') {
      // Wait for any auto-transfer to finish before reporting.
      if (t.transferStatus === 'PENDING' || t.transferStatus === 'PROCESSING') continue;
      const ok = t.transferStatus === 'SUCCESSFUL' || t.transferStatus === 'NONE' || !t.transferStatus;
      return done(ok, { reference, status: 'PAID', transferStatus: t.transferStatus, transaction: t });
    }
  }
  done(false, { reference, status: 'TIMED_OUT' });
}

// ── direct mode: call ITECpay directly ───────────────────────────────────────
async function runDirect() {
  const provider = PROVIDER || detectProvider(PHONE);
  const reqRef = randomUUID();
  log(`▶ direct mode   ITECpay=${ITEC_BASE}  provider=${provider}  phone=${PHONE}  amount=${AMOUNT} RWF`);

  const pay = await postJson(`${ITEC_BASE}/api2/pay`, {
    amount: AMOUNT,
    phone: PHONE,
    key: KEY[provider],
    req_ref: reqRef,
    note: NOTE,
    message: 'SmartPay live test',
  });
  log(`  /api2/pay → http=${pay.httpStatus} status=${pay.data?.status} transID=${pay.data?.data?.transID}`);
  const accepted = (pay.data?.status ?? pay.httpStatus) === 200 && Boolean(pay.data?.data?.transID);
  if (!accepted) {
    return done(false, { stage: 'pay', status: 'REQUEST_REJECTED', body: pay.data });
  }

  log(`  polling /api2/verify every ${INTERVAL}ms (max ${MAX})…`);
  log(`  → approve the prompt on ${PHONE} now.`);

  for (let attempt = 1; attempt <= MAX; attempt++) {
    await sleep(INTERVAL);
    const { httpStatus, data } = await postJson(`${ITEC_BASE}/api2/verify`, {
      action: 'status_check',
      req_ref: reqRef,
      key: KEY[provider],
    });
    const raw = String(data?.data?.status ?? '').toUpperCase();
    log(`    [${attempt}/${MAX}] http=${httpStatus} status=${raw || '(none)'}`);
    if (raw === 'SUCCESSFUL' || raw === 'SUCCESS') return done(true, { reqRef, status: 'SUCCESSFUL', body: data });
    if (raw === 'FAILED' || raw === 'FAILURE') return done(false, { reqRef, status: 'FAILED', body: data });
  }
  done(false, { reqRef, status: 'TIMED_OUT' });
}

if (!PHONE) {
  console.error('Missing --phone (or TEST_PHONE env). Example: node backend/scripts/live-test.mjs --phone 0788000000 --amount 100');
  process.exit(2);
}

(MODE === 'direct' ? runDirect() : runGateway()).catch((err) => {
  console.error('Live test crashed:', err);
  process.exit(1);
});
