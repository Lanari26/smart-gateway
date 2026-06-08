import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ArrowUpRight, 
  CreditCard, 
  Filter, 
  RefreshCw, 
  DollarSign, 
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Transaction } from '../../types';

interface DashboardTabProps {
  transactions: Transaction[];
  onRefund: (id: string) => void;
  onNavigate: (screen: 'landing' | 'checkout' | 'console') => void;
}

export default function DashboardTab({ transactions, onRefund, onNavigate }: DashboardTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

  // Compute stats
  const totalVolume = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingVolume = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const successRate = transactions.length > 0
    ? (transactions.filter(t => t.status === 'paid').length / transactions.length) * 100
    : 100;

  // Filter Transactions
  const filteredTxns = transactions.filter(t => {
    const matchesSearch = t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans">
      
      {/* Dynamic Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-white">Merchant Gateway Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time transactional summary, acquirer routing health, and deposit reconciliation logs.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            id="dash-launch-checkout"
            onClick={() => onNavigate('checkout')}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Open Checkout Test</span>
          </button>
        </div>
      </div>

      {/* Hero Stats Panel grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gross Volume */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-y-6 translate-x-6 blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Gross Volume (Paid)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold text-white">${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="mt-2.5 flex items-center space-x-1 text-emerald-400 text-xs">
            <TrendingUp className="w-3 px-0.5" />
            <span className="font-semibold">+18.4%</span>
            <span className="text-slate-500 font-mono text-[10px]">this month</span>
          </div>
        </div>

        {/* Success processing rate */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6 blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Success Rate (Avg)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-505/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold text-emerald-450">{successRate.toFixed(2)}%</p>
          <div className="mt-2.5 flex items-center space-x-1 text-emerald-400 text-xs">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-slate-400 text-[10px] uppercase font-mono">Average latency 140ms</span>
          </div>
        </div>

        {/* Pending Clearing volume */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6 blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Pending Settlement</span>
            <div className="w-8 h-8 rounded-lg bg-amber-505/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold text-slate-100">${pendingVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="mt-2.5 flex items-center space-x-1 text-slate-500 text-[11px] font-mono">
            <span>Clearing routing cycle: 24h</span>
          </div>
        </div>

        {/* Smart routing savings */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6 blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Protocol Net Savings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-505/15 border border-amber-505/30 text-amber-300 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          {/* Fictional savings calculation (1.4% saved on total volume) */}
          <p className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">${(totalVolume * 0.014).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="mt-2.5 flex items-center space-x-1 text-amber-400 text-xs">
            <TrendingUp className="w-3 px-0.5 text-amber-400" />
            <span className="font-semibold">+1.4% Net Margin</span>
            <span className="text-slate-500 font-mono text-[10px]">Optimized in routing</span>
          </div>
        </div>

      </div>

      {/* SVG Sales History Visual Chart Representation */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400">Processing Activity Performance Chart</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Clearing settlement timings versus hour clusters over the current week-period.</p>
          </div>
          <div className="flex space-x-2 text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded-lg border border-slate-900">
            <span className="px-2 py-0.5 rounded bg-indigo-600 font-bold text-white uppercase">Processed (USD)</span>
            <span className="px-2 py-0.5">Speed (ms)</span>
          </div>
        </div>

        {/* Graphic SVG Plot */}
        <div className="w-full h-44 relative">
          <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            {/* Background grid */}
            <line x1="0" y1="20" x2="1000" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="50" x2="1000" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="80" x2="1000" y2="80" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
            
            {/* Filled Chart */}
            <path 
              d="M 0 100 L 0 80 Q 150 20 250 65 T 500 25 T 750 78 T 1000 40 L 1000 100 Z" 
              fill="url(#chartGrad)" 
            />
            {/* Chart Line */}
            <path 
              d="M 0 80 Q 150 20 250 65 T 500 25 T 750 78 T 1000 40" 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex justify-between pointer-events-none text-[9px] text-slate-500 font-mono mt-2 align-bottom h-full items-end">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun (Today YTD)</span>
          </div>
        </div>
      </div>

      {/* Transaction tables */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Gateway Activity</h3>
            <p className="text-xs text-slate-400">Search and audit all sandbox incoming charges.</p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search by customer, text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-505 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none bg-slate-950 border border-slate-900 rounded-lg text-xs font-medium text-slate-300 pl-3.5 pr-8 py-1.5 outline-none hover:border-slate-800 transition cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Grid or Table list */}
        <div className="bg-slate-900/10 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/80 text-[10px] font-mono tracking-wider uppercase text-slate-500 bg-slate-950/40">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Charge status</th>
                  <th className="px-5 py-3">Total paid</th>
                  <th className="px-5 py-3">Auth method</th>
                  <th className="px-5 py-3">Transaction ID</th>
                  <th className="px-5 py-3 text-right">Administrative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs">
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-mono">
                      No matching checkout transactions found. Try launching a dynamic payment sandbox portal charge above!
                    </td>
                  </tr>
                ) : (
                  filteredTxns.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-900/20 transition">
                      
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-800 flex items-center justify-center font-bold text-indigo-400">
                            {txn.avatarLetter}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{txn.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{txn.customerEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status checkbox color */}
                      <td className="px-5 py-3.5">
                        {txn.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                            PAID_SETTLED
                          </span>
                        )}
                        {txn.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-400 bg-amber-955/30 border border-amber-900/30 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                            MOCK_PENDING
                          </span>
                        )}
                        {txn.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-rose-450 bg-rose-955/30 border border-rose-900/20 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-rose-450 rounded-full" />
                            DECLINED
                          </span>
                        )}
                      </td>

                      {/* Settlement Amount */}
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-200">
                        ${txn.amount.toFixed(2)}
                      </td>

                      {/* Method Used */}
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {txn.method}
                      </td>

                      {/* Hash Token transaction */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-indigo-400 bg-indigo-505/10 px-2.5 py-0.5 border border-indigo-900/40 rounded">
                          {txn.id}
                        </span>
                      </td>

                      {/* Administrative Actions - Refund */}
                      <td className="px-5 py-3.5 text-right">
                        {txn.status === 'paid' ? (
                          <button
                            type="button"
                            onClick={() => onRefund(txn.id)}
                            className="text-[10px] font-semibold text-slate-400 hover:text-rose-400 px-2 py-1 rounded bg-slate-950 hover:bg-rose-950/20 border border-slate-900 hover:border-rose-900/30 transition cursor-pointer"
                          >
                            Refund Client
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600 italic">No actions available</span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
