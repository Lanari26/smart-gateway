import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { ActiveScreen, BillingPlan, Transaction } from '../types';
import { INITIAL_BILLING_PLANS } from '../mockData';
import { paymentsApi } from '../lib/endpoints';
import { ApiError } from '../lib/api';

interface CheckoutPageProps {
  onNavigate: (screen: ActiveScreen) => void;
}

type Method = 'momo' | 'card';
type PaymentState = 'idle' | 'processing' | 'success' | 'failed';

// Status polling cadence — mirrors the backend's own poll loop.
const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 45; // ~3 minutes before we stop watching.

export default function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const [method, setMethod] = useState<Method>('momo');

  // A hosted checkout is opened with the merchant's publishable key in the link
  // (pay.lanari.rw/?screen=checkout&key=pk_live_…). Falls back to a manual field.
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return new URLSearchParams(window.location.search).get('key')?.trim() || '';
    } catch {
      return '';
    }
  });

  // Shared fields
  const [amount, setAmount] = useState<number>(Math.round(INITIAL_BILLING_PLANS[1]?.price ?? 1000));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // MoMo-only
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  // Flow state
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const attemptsRef = useRef(0);

  // ── Auto status polling ────────────────────────────────────────────────────
  // Once a MoMo charge is accepted we keep hitting the status endpoint (which
  // performs a live verify against the gateway) until it settles paid/failed.
  useEffect(() => {
    if (paymentState !== 'processing' || !reference) return;

    let cancelled = false;
    attemptsRef.current = 0;

    const tick = async () => {
      if (cancelled) return;
      attemptsRef.current += 1;

      try {
        const txn = await paymentsApi.status(reference);
        if (cancelled) return;

        if (txn.status === 'paid') {
          setReceipt(txn);
          setPaymentState('success');
          return;
        }
        if (txn.status === 'failed') {
          setStatusMessage('The payment was declined or cancelled by the payer.');
          setPaymentState('failed');
          return;
        }
      } catch {
        /* transient network/gateway error — keep polling */
      }

      if (cancelled) return;
      if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
        setStatusMessage('Timed out waiting for approval. The charge is still pending — verify before retrying.');
        setPaymentState('failed');
        return;
      }
      timer = window.setTimeout(tick, POLL_INTERVAL_MS);
    };

    let timer = window.setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [paymentState, reference]);

  const resetForm = () => {
    setPaymentState('idle');
    setStatusMessage('');
    setReference(null);
    setReceipt(null);
    setPhone('');
    setNote('');
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleMomoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    if (!apiKey) {
      setStatusMessage('An API key is required. Open this checkout via a link that includes ?key=pk_… or paste a key below.');
      return;
    }
    setSubmitting(true);
    setStatusMessage('');

    try {
      const res = await paymentsApi.momo({ customerName: name, customerEmail: email, phone, amount, note: note || undefined }, apiKey);
      if (!res.accepted) {
        setStatusMessage(res.message || 'The gateway rejected the payment request. Check the number and try again.');
        setPaymentState('failed');
        return;
      }
      setReference(res.transaction.reference ?? null);
      setReceipt(res.transaction);
      setStatusMessage('Approve the Mobile Money prompt on your phone (enter your PIN).');
      setPaymentState('processing');
    } catch (err) {
      setStatusMessage(err instanceof ApiError ? err.message : 'Could not reach the payment gateway. Try again.');
      setPaymentState('failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    if (!apiKey) {
      setStatusMessage('An API key is required. Open this checkout via a link that includes ?key=pk_… or paste a key below.');
      return;
    }
    setSubmitting(true);
    setStatusMessage('');

    try {
      const res = await paymentsApi.card({ customerName: name, email, amount }, apiKey);
      // Hand off to the hosted card page to complete the payment.
      window.location.href = res.link;
    } catch (err) {
      setStatusMessage(err instanceof ApiError ? err.message : 'Could not generate a card payment link. Try again.');
      setPaymentState('failed');
      setSubmitting(false);
    }
  };

  const presetChips = INITIAL_BILLING_PLANS.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 relative font-sans flex items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button
            id="checkout-back-btn"
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span>Back to Landing Page</span>
          </button>
          <button
            id="checkout-console-btn"
            onClick={() => onNavigate('console')}
            className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition"
          >
            Merchant Console
          </button>
        </div>

        {/* ── Idle: payment form ── */}
        {paymentState === 'idle' && (
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
            <div>
              <span className="text-xs font-mono text-indigo-400 font-bold tracking-widest uppercase block mb-1">SECURE CHECKOUT</span>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white">SmartPay Gateway Checkout</h1>
              <p className="text-xs text-slate-400 mt-1">Pay with Mobile Money or card. Settlement in Rwandan Francs (RWF).</p>
            </div>

            {/* Method toggle */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'momo' as Method, label: 'Mobile Money', icon: Smartphone },
                { id: 'card' as Method, label: 'Card', icon: CreditCard },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    method === id
                      ? 'bg-indigo-500/15 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Amount + presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-400 block">Amount (RWF)</label>
              <input
                type="number"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Math.floor(Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition font-mono"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {presetChips.map((p: BillingPlan) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAmount(Math.round(p.price))}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300 transition"
                  >
                    {p.name.split(' ')[1] || p.name} · {Math.round(p.price).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={method === 'momo' ? handleMomoSubmit : handleCardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Customer name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="client@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  API Key <span className="text-slate-600">(pk_… publishable, or sk_… secret)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="pk_live_… — from the merchant's Developers tab"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value.trim())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Identifies the merchant; the charge is recorded under this key's owner.</p>
              </div>

              {method === 'momo' && (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Mobile Money Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="07XXXXXXXX (MTN or Airtel)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">The network is auto-detected (072/073 → Airtel, otherwise MTN).</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Note <span className="text-slate-600">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. invoice-1234"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </>
              )}

              {statusMessage && paymentState === 'idle' && (
                <p className="text-[11px] text-rose-400 font-mono">{statusMessage}</p>
              )}

              <button
                id="submit-payment-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 text-xs text-white hover:from-indigo-500 hover:to-indigo-600 transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/40 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-300" />
                <span>
                  {submitting
                    ? 'Contacting gateway…'
                    : method === 'momo'
                    ? `Request RWF ${amount.toLocaleString()} via Mobile Money`
                    : `Pay RWF ${amount.toLocaleString()} by Card`}
                </span>
              </button>
            </form>

            <p className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Payments processed securely via the ITECpay gateway</span>
            </p>
          </div>
        )}

        {/* ── Processing: live polling ── */}
        {paymentState === 'processing' && (
          <div className="bg-slate-900/50 rounded-3xl p-10 border border-slate-850 text-center space-y-6 py-16">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Waiting for approval…</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">{statusMessage}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 mx-auto max-w-[360px] space-y-1">
              <p className="text-[10px] font-mono text-slate-500">REFERENCE</p>
              <p className="text-xs font-mono text-indigo-400 font-medium">{reference}</p>
            </div>
            <button
              onClick={resetForm}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              Cancel and start over
            </button>
          </div>
        )}

        {/* ── Success ── */}
        {paymentState === 'success' && receipt && (
          <div className="bg-slate-900/55 rounded-3xl p-6 sm:p-10 border border-slate-850 space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-450 to-teal-505" />
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs uppercase font-mono text-emerald-400 font-bold tracking-widest">PAYMENT CONFIRMED</span>
              <h2 className="text-2xl font-display font-semibold text-white">Payment Successful</h2>
              <p className="text-slate-400 text-xs">{receipt.message || 'The charge has settled and been recorded in the merchant ledger.'}</p>
            </div>
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/60 text-left space-y-3 font-mono text-xs">
              <Row label="Reference" value={receipt.reference || receipt.id} />
              <Row label="Customer" value={receipt.customerName} />
              <Row label="Email" value={receipt.customerEmail} />
              <Row label="Method" value={receipt.method} />
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="text-emerald-400 font-bold">RWF {Math.round(receipt.amount).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => onNavigate('console')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition cursor-pointer"
              >
                Go to Merchant Console
              </button>
              <button
                onClick={resetForm}
                className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                New Payment
              </button>
            </div>
          </div>
        )}

        {/* ── Failed ── */}
        {paymentState === 'failed' && (
          <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-10 border border-slate-850 space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-rose-700" />
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-500">
              <XCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs uppercase font-mono text-rose-500 font-bold tracking-widest">PAYMENT NOT COMPLETED</span>
              <h2 className="text-2xl font-display font-semibold text-white">Transaction Failed</h2>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-900/30 text-rose-400 text-xs font-mono text-left">
              <p className="text-slate-400">{statusMessage || 'The payment could not be completed.'}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={resetForm}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={() => onNavigate('console')}
                className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Go to Console
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}
