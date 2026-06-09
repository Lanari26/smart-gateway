import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  CreditCard,
  Building,
  RefreshCw,
  TrendingDown,
  ChevronDown
} from 'lucide-react';
import { ActiveScreen, BillingPlan, Transaction } from '../types';
import { INITIAL_BILLING_PLANS } from '../mockData';
import { transactionsApi } from '../lib/endpoints';

interface CheckoutPageProps {
  onNavigate: (screen: ActiveScreen) => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'JPY', symbol: '¥', rate: 155 }
];

export default function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  // Plan and Currency Selection
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>(INITIAL_BILLING_PLANS[1]);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);

  // Card Form Fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [email, setEmail] = useState('');
  
  // Custom sandbox settings
  const [forceFail, setForceFail] = useState(false);

  // Interaction State management
  const [isFocused, setIsFocused] = useState('');
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [createdReceipt, setCreatedReceipt] = useState<Transaction | null>(null);

  // Guess the Card Issuer Card Branding
  const getCardBrand = (num: string) => {
    const cleanNum = num.replace(/\s+/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (cleanNum.startsWith('5')) return 'Mastercard';
    if (cleanNum.startsWith('37') || cleanNum.startsWith('34')) return 'Amex';
    if (cleanNum.startsWith('6')) return 'Discover';
    return 'Unknown';
  };

  // Card formatting hook
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // digits only
    if (value.length > 16) value = value.slice(0, 16);
    
    // Add spaces every 4 characters
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // digits only
    if (value.length > 4) value = value.slice(0, 4);
    
    if (value.length > 2) {
      setCardExpiry(value.slice(0, 2) + '/' + value.slice(2));
    } else {
      setCardExpiry(value);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // digits only
    if (value.length > 4) value = value.slice(0, 4);
    setCardCvc(value);
  };

  // Pricing calculations
  const basePrice = selectedPlan.price * selectedCurrency.rate;
  const processingFee = (basePrice * 0.015) + (0.10 * selectedCurrency.rate);
  const grandTotal = basePrice + processingFee;

  // Simulate Payments Flow
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !cardExpiry || !cardCvc || !email) {
      alert("Please complete all payment fields to proceed.");
      return;
    }

    setPaymentState('processing');
    
    // Stagger status states to simulate routing
    const statuses = [
      "Tokenizing sensitive checkout values...",
      "Analyzing bank risk parameters...",
      forceFail 
        ? "Acquirer network returned routing error code (FORCED_SANDBOX_FAIL)..."
        : "Dynamic routing optimization: processing with lowest cost acquirer...",
      "Settling core interchange balance ledger...",
    ];

    let step = 0;
    setStatusMessage(statuses[0]);

    const interval = setInterval(() => {
      step++;
      if (step < statuses.length) {
        setStatusMessage(statuses[step]);
      } else {
        clearInterval(interval);
        
        if (forceFail) {
          setPaymentState('failed');
          setStatusMessage("The transaction was declined by the simulated card issuer. (Code: 51 - Insufficient Funds)");
        } else {
          const amountInUSD = selectedPlan.price;
          const method = `${getCardBrand(cardNumber)} •••• ${cardNumber.slice(-4) || '9999'}`;

          // Local receipt so the UI completes instantly.
          const localReceipt: Transaction = {
            id: `tx_${Math.random().toString(36).substring(2, 8)}`,
            customerName: cardName,
            customerEmail: email,
            avatarLetter: cardName.charAt(0).toUpperCase() || 'U',
            status: 'paid',
            amount: Number(amountInUSD.toFixed(2)),
            method,
            date: new Date().toLocaleString(),
          };
          setCreatedReceipt(localReceipt);
          setPaymentState('success');

          // Record the charge on the live backend (public hosted-checkout endpoint).
          transactionsApi
            .checkout({ customerName: cardName, customerEmail: email, amount: Number(amountInUSD.toFixed(2)), method })
            .then((txn) => setCreatedReceipt(txn))
            .catch(() => undefined);
        }
      }
    }, 1200);
  };

  const getCardBg = () => {
    const brand = getCardBrand(cardNumber);
    switch (brand) {
      case 'Visa':
        return 'from-blue-600 via-indigo-600 to-blue-800';
      case 'Mastercard':
        return 'from-rose-600 via-amber-600 to-rose-700';
      case 'Amex':
        return 'from-emerald-500 via-teal-600 to-cyan-700';
      case 'Discover':
        return 'from-purple-600 via-pink-600 to-purple-800';
      default:
        return 'from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 relative font-sans flex items-center justify-center">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl z-10">
        {/* Navigation Action */}
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
            className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-505/20 px-3 py-1.5 rounded-lg transition overflow-hidden"
          >
            Merchant Console
          </button>
        </div>

        {paymentState === 'idle' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-slate-900/40 border border-slate-900 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
            
            {/* Form Section */}
            <form onSubmit={handleSubmitPayment} className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold tracking-widest uppercase block mb-1">SECURE TRANSACTION</span>
                <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white">SmartPay Gateway Checkout</h1>
                <p className="text-xs text-slate-400 mt-1">Complete your simulated purchase using the compliant sandbox gateway processing interface.</p>
              </div>

              {/* Package selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Select Subscription Package</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INITIAL_BILLING_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-3.5 rounded-xl text-left border transition relative flex flex-col justify-between h-28 cursor-pointer ${
                        selectedPlan.id === plan.id
                          ? 'bg-indigo-650/20 border-indigo-500 shadow-md shadow-indigo-900/30'
                          : 'bg-slate-950 border-slate-805 hover:border-slate-700 hover:bg-slate-900/40'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">PLAN</span>
                        <span className="text-xs font-semibold text-white block truncate">{plan.name.split(' ')[1] || 'Plan'}</span>
                      </div>
                      <div>
                        <span className="text-lg font-bold font-display text-white">
                          {selectedCurrency.symbol}{Math.round(plan.price * selectedCurrency.rate)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono"> /mo</span>
                      </div>
                      {plan.isPopular && (
                        <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wider font-mono font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded">POPULAR</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Currency Dropdown */}
              <div className="flex space-x-3 items-center">
                <span className="text-xs text-slate-400">Checkout Currency:</span>
                <div className="relative">
                  <select
                    value={selectedCurrency.code}
                    onChange={(e) => {
                      const found = CURRENCIES.find(c => c.code === e.target.value);
                      if (found) setSelectedCurrency(found);
                    }}
                    className="appearance-none bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 px-3.5 py-1.5 pr-8 rounded-lg outline-none hover:border-indigo-505/50 transition cursor-pointer"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.code}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="border-t border-slate-800/60 my-6" />

              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Billing Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. client@waynecorp.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Cardholder Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Full name as printed"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      onFocus={() => setIsFocused('name')}
                      onBlur={() => setIsFocused('')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Card input */}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Credit Card Number</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      onFocus={() => setIsFocused('number')}
                      onBlur={() => setIsFocused('')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition font-mono tracking-widest"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {getCardBrand(cardNumber) !== 'Unknown' && (
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-400 absolute right-3.5 top-1/2 -translate-y-1/2">
                        {getCardBrand(cardNumber)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Expiration Date</label>
                    <input 
                      type="text" 
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      onFocus={() => setIsFocused('expiry')}
                      onBlur={() => setIsFocused('')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">CVC Code</label>
                    <input 
                      type="password" 
                      required
                      placeholder="•••"
                      maxLength={4}
                      value={cardCvc}
                      onChange={handleCvcChange}
                      onFocus={() => setIsFocused('cvc')}
                      onBlur={() => setIsFocused('')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition font-mono tracking-widest"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle sandbox failures */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-amber-500 font-mono block">DEVELOPER SANDBOX SETTING</span>
                  <p className="text-[10px] text-slate-400">Toggle this key to force an acquirer routing decline response code.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={forceFail} 
                    onChange={() => setForceFail(!forceFail)} 
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-350 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                </label>
              </div>

              {/* Secure pay button */}
              <button 
                id="submit-payment-btn"
                type="submit" 
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 text-xs text-white hover:from-indigo-500 hover:to-indigo-600 transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/40 active:scale-95 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-300" />
                <span>Authorize Payment Gateway Charge</span>
              </button>
            </form>

            {/* Sidebar Visual Summary */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card visual showcase */}
              <div className={`w-full aspect-[1.586/1] bg-gradient-to-br ${getCardBg()} rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden transition-all duration-500 flex flex-col justify-between`}>
                <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full -translate-y-8 translate-x-8 blur-xl pointer-events-none" />
                
                {/* Chip and brand */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Gateway Sandbox</span>
                    {/* Simulated card chip graphic */}
                    <div className="w-9 h-7 bg-amber-500/80 rounded-md border border-amber-600/50 flex flex-col justify-around p-1">
                      <div className="h-[2px] bg-amber-800/40 w-full" />
                      <div className="h-[2px] bg-amber-800/40 w-full" />
                    </div>
                  </div>
                  
                  <span className="text-sm font-display font-medium text-slate-300 uppercase italic">
                    {getCardBrand(cardNumber) !== 'Unknown' ? getCardBrand(cardNumber) : 'SmartPay'}
                  </span>
                </div>

                {/* Card Number display */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-400 block tracking-widest leading-none">Card Number</span>
                  <p className="text-sm sm:text-base font-mono tracking-widest font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-200">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </p>
                </div>

                {/* Details row */}
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase font-mono text-slate-500 block">Holder</span>
                    <span className="text-xs font-mono font-medium truncate max-w-[140px] block uppercase">
                      {cardName || 'YOUR FULL NAME'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="space-y-0.5">
                      <span className="text-[8px] uppercase font-mono text-slate-500 block">Expiry</span>
                      <span className="text-xs font-mono font-medium">
                        {cardExpiry || 'MM/YY'}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] uppercase font-mono text-slate-500 block">CVC</span>
                      <span className="text-xs font-mono font-medium">
                        {cardCvc ? '•••' : '000'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fees breakdown */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Purchase Receipts Summary</h3>
                
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{selectedPlan.name}</span>
                  <span className="font-semibold text-slate-200">
                    {selectedCurrency.symbol}{basePrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-indigo-400 bg-indigo-505/10 p-2.5 rounded-lg border border-indigo-900/30">
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Dynamic Routing fee (1.5% + $0.10)</span>
                  </div>
                  <span className="font-mono font-medium">
                    {selectedCurrency.symbol}{processingFee.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-slate-850 pt-3 flex justify-between text-sm">
                  <span className="font-sans font-medium text-slate-300">Authorized Grand Total</span>
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-rose-300 to-amber-200 font-display">
                    {selectedCurrency.symbol}{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* ISO reference and encryption badge */}
              <div className="text-center space-y-2">
                <p className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1.5 justify-center">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>ISO 27001 Cryptographic Tunneling Protocol active</span>
                </p>
                <div className="flex justify-center space-x-4 opacity-30 select-none">
                  <Building className="w-6 h-6" />
                  <div className="h-6 w-px bg-slate-800" />
                  <span className="text-xs font-mono font-bold">PCI-DSS L1</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Processing State Anim */}
        {paymentState === 'processing' && (
          <div className="bg-slate-900/50 block rounded-3xl p-10 border border-slate-850 text-center space-y-6 max-w-lg mx-auto py-16">
            <div className="w-16 h-16 rounded-full bg-indigo-550/10 border border-indigo-500/20 flex items-center justify-center mx-auto relative">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Contacting Router Engine...</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Please do not refresh nor navigate away while your secure transaction settles.</p>
            </div>

            <div className="flex justify-center bg-slate-950 p-3 rounded-lg border border-slate-900 mx-auto max-w-[340px]">
              <span className="text-xs font-mono text-indigo-400 font-medium">
                {statusMessage}
              </span>
            </div>
          </div>
        )}

        {/* Success Page */}
        {paymentState === 'success' && createdReceipt && (
          <div className="bg-slate-900/55 rounded-3xl p-6 sm:p-10 border border-slate-850 max-w-xl mx-auto space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-450 to-teal-505" />

            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs uppercase font-mono text-emerald-400 font-bold tracking-widest">GATEWAY AUTHORIZED</span>
              <h2 className="text-2xl font-display font-semibold text-white">Payment Confirmed</h2>
              <p className="text-slate-400 text-xs">Your sandbox payment has been successfully recorded and processed into the billing ledger database.</p>
            </div>

            {/* Receipt Summary info */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/60 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-slate-300 font-bold uppercase">{createdReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="text-slate-300">{createdReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Email:</span>
                <span className="text-slate-300">{createdReceipt.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Settled Amount:</span>
                <span className="text-emerald-400 font-bold">${createdReceipt.amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method Code:</span>
                <span className="text-slate-300 font-semibold">{createdReceipt.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Settled Date:</span>
                <span className="text-slate-400">{createdReceipt.date}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                id="success-console-btn"
                onClick={() => onNavigate('console')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition cursor-pointer"
              >
                Go to Merchant Dashboard Console
              </button>
              
              <button 
                id="success-reset-btn"
                onClick={() => {
                  setPaymentState('idle');
                  setCardName('');
                  setCardNumber('');
                  setCardExpiry('');
                  setCardCvc('');
                  setEmail('');
                  setCreatedReceipt(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Create Another Charge
              </button>
            </div>
          </div>
        )}

        {/* Failed Page */}
        {paymentState === 'failed' && (
          <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-10 border border-slate-850 max-w-xl mx-auto space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-rose-700" />

            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-500">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs uppercase font-mono text-rose-500 font-bold tracking-widest">TRANSACTION DECLINED</span>
              <h2 className="text-2xl font-display font-semibold text-white">Acquirer Decline</h2>
              <p className="text-slate-400 text-xs text-center">Your standard routing authorization request was rejected. Developers can view audit details inside the Projects Tab.</p>
            </div>

            {/* Error Message Panel */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-900/30 text-rose-450 text-xs font-mono text-left space-y-1.5">
              <p className="font-semibold">Reason: DECLINED_BY_ISSUER</p>
              <p className="text-slate-400">{statusMessage}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                id="fail-retry-btn"
                onClick={() => setPaymentState('idle')}
                className="w-full py-2.5 rounded-xl bg-indigo-650/80 hover:bg-indigo-600 text-white text-xs font-bold transition cursor-pointer"
              >
                Retry Charge Request
              </button>
              
              <button 
                id="fail-console-btn"
                onClick={() => onNavigate('console')}
                className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Go to Developers Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
