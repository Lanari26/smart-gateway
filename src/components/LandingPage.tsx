import React, { useState } from 'react';
import { 
  ArrowRight, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Layers, 
  CreditCard, 
  Calculator, 
  CheckCircle,
  CodeXml,
  Sparkles
} from 'lucide-react';
import { ActiveScreen } from '../types';

interface LandingPageProps {
  onNavigate: (screen: ActiveScreen) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  // Volume state for calculator (in RWF per month)
  const [monthlyVolume, setMonthlyVolume] = useState<number>(65000000);
  const [txnRate, setTxnRate] = useState<number>(130000); // average order value

  const expectedTxnCount = Math.round(monthlyVolume / (txnRate || 65000));

  // Pricing comparisons
  // Standard processors: 2.9% + RWF 390 per transaction
  const standardCost = (monthlyVolume * 0.029) + (expectedTxnCount * 390);
  // SmartPay rate: 1.5% + RWF 130 per transaction
  const smartPayCost = (monthlyVolume * 0.015) + (expectedTxnCount * 130);
  const savings = Math.max(0, standardCost - smartPayCost);

  // Sample API Code shown on landing page
  const codeSnippet = `const smartpay = require('@smartpay/gateway')('sk_live_v93f...');

// Initialize dynamic routing session
const checkoutSession = await smartpay.sessions.create({
  amount: 115700, // RWF 115,700
  currency: 'rwf',
  success_url: 'https://mysite.com/success',
  metadata: {
    customerId: 'cust_abc123',
    plan: 'growth_pro'
  }
});

return checkoutSession.secure_url;`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-500 p-[2px] flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-amber-100">SmartPay</span>
            <span className="text-xs text-indigo-400 font-mono block tracking-wider leading-none">GATEWAY V2.1</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#developer-sandbox" className="hover:text-white transition">API Integration</a>
          <a href="#calculator" className="hover:text-white transition">Fee Calculator</a>
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            GATEWAY ONLINE
          </span>
        </nav>

        <div className="flex items-center space-x-3">
          <button 
            id="nav-checkout-btn"
            onClick={() => onNavigate('checkout')}
            className="hidden sm:inline-flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/45 transition cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Open Checkout Test</span>
          </button>
          
          <button 
            id="nav-console-btn"
            onClick={() => onNavigate('console')}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-900/30 active:scale-95 transition cursor-pointer"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10 flex-1">
        {/* Sparkle Banner */}
        <div className="animate-fade-in inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-indigo-300 font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Intelligent Smart-Routing Protocol Released</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          The payments gateway console built for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-300 font-bold">
            enterprise scalability
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-10">
          A premium unified billing protocol, high-fidelity dynamic checkouts, structured invoice orchestration systems, and interactive AI developer sandboxes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-20">
          <button 
            id="hero-console-btn"
            onClick={() => onNavigate('console')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-slate-950 font-semibold hover:bg-slate-100 transition shadow-lg shadow-white/5 active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>Go to Merchant Console</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
          
          <button 
            id="hero-checkout-btn"
            onClick={() => onNavigate('checkout')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-820 hover:text-white transition active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Launch Smart Checkout</span>
          </button>
        </div>

        {/* Dashboard Preview Mimic */}
        <div className="w-full max-w-5xl rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl p-4 sm:p-6 text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono text-slate-500 pl-2">live_smartpay_console</span>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">MERCHANT ENDPOINT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Gross Volume (YTD)</span>
              <p className="text-2xl font-display font-semibold mt-1 text-white">RWF 1,927,770,000</p>
              <span className="text-xs text-emerald-400 mt-1 inline-flex items-center gap-1">↑ 24% month-over-month</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Gateway Success Rate</span>
              <p className="text-2xl font-display font-semibold mt-1 text-emerald-400">99.98%</p>
              <span className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">Average settlement 1.4s</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">AI Routed Savings</span>
              <p className="text-2xl font-display font-semibold mt-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 font-semibold">RWF 32,425,250</p>
              <span className="text-xs text-amber-400/80 mt-1 inline-flex items-center gap-1">Dynamic merchant routing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 bg-slate-950 border-t border-slate-900 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white mb-4">
              Designed to optimize checkout conversion & developer efficiency
            </h2>
            <p className="text-slate-400 text-sm">
              SmartPay sits directly behind your existing application stack to inject stability, compliance, dynamic RWF settlement processing, and high-fidelity administration tooling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-slate-800 transition group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Router</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automatically switches secondary acquirer networks when latency peaks or bank processing routes go cold, optimizing success metrics.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-slate-800 transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Developer Focus</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Bespoke JSON sandboxes. Generate instant mock test hooks, rotate server API tokens, and control whitelisted server IP blocks natively.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-slate-800 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">PCI Compliant Checkout</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Beautiful dynamic client-side checkouts. Fully integrated credit validation, RWF settlement, and robust client transaction statuses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic API Section */}
      <section id="developer-sandbox" className="py-20 bg-slate-950/50 border-t border-slate-900 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-3">SANDBOX APIS</span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white mb-6">
              Plug and play payment routines with minimal effort
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Enable full checkout configurations right inside your backend container. Our light-weight Node client lets you provision single session tokens, secure invoices, or set up recursive customer payment subscriptions with premium compliance rules.
            </p>

            <ul className="space-y-3">
              {[
                "Automatic credit card type formatting validation",
                "Full event audit log with customizable webhook triggers",
                "Built-in tokenization securing customer credit details"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2.5 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button 
              id="features-console-btn"
              onClick={() => onNavigate('console')}
              className="mt-8 px-6 py-2.5 rounded-lg text-xs font-semibold bg-slate-905 border border-slate-800 text-white hover:bg-slate-900 transition flex items-center space-x-2 cursor-pointer"
            >
              <span>Explore Developer Center</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>

          {/* Interactive Code Container */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <CodeXml className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-300 font-mono font-medium">Node.js SmartPay SDK</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-505/20 px-2 py-0.5 rounded font-bold">STRICT_HTTPS</span>
            </div>
            <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {codeSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* Fee Calculator Section */}
      <section id="calculator" className="py-20 bg-slate-950 border-t border-slate-900 px-6 relative z-10">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-500" />
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-semibold text-white">Dynamic Fee Optimization Savings</h2>
              <p className="text-slate-400 text-xs">Estimate merchant gateway cost metrics against typical providers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 items-center">
            <div className="space-y-6">
              {/* Volume Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-300 font-medium">Estimated Monthly Volume</span>
                  <span className="text-sm font-semibold text-white font-mono">RWF {monthlyVolume.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1300000}
                  max={325000000}
                  step={6500000}
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-505"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>RWF 1.3M</span>
                  <span>RWF 130M</span>
                  <span>RWF 325M+</span>
                </div>
              </div>

              {/* Transaction Order Value Picker */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-300 font-medium font-sans">Average Order Value</span>
                  <span className="text-sm font-mono font-semibold text-white">RWF {txnRate.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[32500, 65000, 130000, 325000].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTxnRate(rate)}
                      className={`py-1.5 rounded-md text-xs font-mono font-medium border transition ${
                        txnRate === rate
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {(rate / 1000).toLocaleString()}K
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-900 space-y-1 text-slate-400 text-xs font-mono">
                <div className="flex justify-between text-[11px]">
                  <span>Estimated Total Transacts:</span>
                  <span className="text-slate-300 font-semibold">{expectedTxnCount.toLocaleString()} tx/mo</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Traditional Rate Model:</span>
                  <span className="text-rose-400 font-medium">2.9% + RWF 390</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>SmartPay Protocol Rate:</span>
                  <span className="text-emerald-400 font-semibold">1.5% + RWF 130</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 bg-indigo-550/10 px-2.5 py-1 rounded-full border border-indigo-500/20 mb-3">Estimated Monthly Savings</span>
              <span className="text-4xl sm:text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">RWF {Math.round(savings).toLocaleString()}</span>
              <span className="text-xs text-slate-400 mt-2">Saved annually: <span className="font-semibold text-emerald-400 font-mono">RWF {Math.round(savings * 12).toLocaleString()}</span></span>

              <button
                id="calc-checkout-btn"
                onClick={() => onNavigate('checkout')}
                className="w-full mt-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-xs font-bold text-white hover:from-indigo-500 hover:to-indigo-600 transition shadow-lg shadow-indigo-900/40 active:scale-[0.97] cursor-pointer"
              >
                Simulate Secure Process
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6 text-center text-xs text-slate-500 mt-auto z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-display font-medium text-slate-400">SmartPay</span>
            <span className="text-slate-600 font-mono">© 2026 Sandbox Environment. All rights reserved.</span>
          </div>
          <div className="flex space-x-6 text-slate-400">
            <button onClick={() => onNavigate('console')} className="hover:text-white transition">Merchant Console</button>
            <button onClick={() => onNavigate('checkout')} className="hover:text-white transition">Gateway Checkout</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
