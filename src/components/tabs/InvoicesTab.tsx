import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Mail, 
  ChevronRight, 
  Printer, 
  Share2,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Invoice } from '../../types';
import { invoicesApi } from '../../lib/endpoints';

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState(130000);
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');

  // Load from the API on mount
  useEffect(() => {
    let active = true;
    invoicesApi.list().then((inv) => active && setInvoices(inv)).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return;
    try {
      const created = await invoicesApi.create({ clientName, clientEmail, amount: Number(amount), status });
      setInvoices((prev) => [created, ...prev]);
      setSelectedInvoice(created);
      setClientName('');
      setClientEmail('');
      setAmount(130000);
      setShowForm(false);
    } catch {
      /* surfaced by the API client */
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await invoicesApi.remove(id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      setSelectedInvoice((sel) => (sel?.id === id ? null : sel));
    } catch {
      /* ignore */
    }
  };

  const toggleStatus = async (id: string, current: 'Paid' | 'Pending' | 'Overdue') => {
    const next: 'Paid' | 'Pending' | 'Overdue' = current === 'Pending' ? 'Paid' : current === 'Paid' ? 'Overdue' : 'Pending';
    try {
      const updated = await invoicesApi.setStatus(id, next);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      setSelectedInvoice((sel) => (sel?.id === id ? updated : sel));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header section row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-white">Invoice Management</h1>
          <p className="text-xs text-slate-400 mt-1">Issue itemized electronic billing ledger sheets and examine settled deposit states.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 text-white transition cursor-pointer shadow shadow-indigo-900"
        >
          <Plus className="w-4 h-4 text-indigo-200" />
          <span>Issue Dynamic Invoice</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateInvoice} className="bg-slate-900/60 p-5 rounded-2xl border border-indigo-550/30 max-w-2xl space-y-4">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider block">Custom Invoice Configurator</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-slate-350 block mb-1">Client Business Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Cyberdyne Systems Ltd"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-350 block mb-1">Client Billing Email</label>
              <input
                type="email"
                required
                placeholder="e.g. accounts@cyberdyne.org"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-505"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-slate-350 block mb-1">Invoice Amount (RWF)</label>
              <input
                type="number"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-350 block mb-1">Initial Invoice Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none h-full focus:border-indigo-500 cursor-pointer"
              >
                <option value="Pending">Pending Payment</option>
                <option value="Paid">Mark as Paid</option>
                <option value="Overdue">Mark as Overdue</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-955 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Generate Bill Sheet
            </button>
          </div>
        </form>
      )}

      {/* Grid List view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Invoices Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/10 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/80 text-[10px] font-mono tracking-wider uppercase text-slate-500 bg-slate-950/40">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-mono">
                      No invoices issued. Create one above!
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr 
                      key={inv.id} 
                      onClick={() => setSelectedInvoice(inv)}
                      className={`hover:bg-slate-900/20 transition cursor-pointer ${
                        selectedInvoice?.id === inv.id ? 'bg-slate-900/40 font-medium' : ''
                      }`}
                    >
                      {/* Name Details */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-800 flex items-center justify-center font-bold text-slate-300">
                            {inv.avatarLetter}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{inv.clientName}</p>
                            <span className="text-[10px] text-slate-500 font-mono block leading-none">{inv.id} • {inv.issueDate}</span>
                          </div>
                        </div>
                      </td>

                      {/* Amount subtotal */}
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-200">
                        RWF {Math.round(inv.amount).toLocaleString()}
                      </td>

                      {/* Invoice Status */}
                      <td className="px-4 py-3.5">
                        {inv.status === 'Paid' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-450 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                            PAID
                          </span>
                        )}
                        {inv.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-500 bg-amber-955/30 border border-amber-900/30 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                            PENDING
                          </span>
                        )}
                        {inv.status === 'Overdue' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-rose-455 bg-rose-955/20 border border-rose-900/20 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-rose-455 rounded-full animate-bounce" />
                            OVERDUE
                          </span>
                        )}
                      </td>

                      {/* Quick controls */}
                      <td className="px-4 py-3.5 text-right space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(inv.id, inv.status);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-900 text-slate-450 hover:text-indigo-400 hover:border-indigo-900/30 transition cursor-pointer"
                          title="Rotate billing state"
                        >
                          Status Toggle
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInvoice(inv.id);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-900 text-slate-500 hover:text-rose-400 hover:border-rose-900/30 transition cursor-pointer"
                          title="Revoke Invoice sheet"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Hand: Deep Invoice Mock Printable Sheet Preview */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 sm:p-6 space-y-6">
          {selectedInvoice ? (
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-850 space-y-6 text-slate-200 text-xs shadow">
              
              {/* Header Branding */}
              <div className="flex justify-between items-start border-b border-slate-900 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">SmartPay Gateway Inc</span>
                    <span className="text-[9px] text-slate-550 block font-mono">BILL_SECURE_TUNNEL</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Statement Code</span>
                  <p className="font-mono text-white font-bold leading-none">{selectedInvoice.id}</p>
                </div>
              </div>

              {/* Entity info blocks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Billed From:</span>
                  <p className="font-semibold text-slate-300">SmartPay Corp Sandbox</p>
                  <p className="text-[10px] text-slate-500">100 Pine Street, Suite 2400</p>
                  <p className="text-[10px] text-slate-500">San Francisco, CA 94111</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Billed To:</span>
                  <p className="font-semibold text-slate-300">{selectedInvoice.clientName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedInvoice.clientEmail}</p>
                  <p className="text-[10px] text-slate-500">Accounts Payable Node</p>
                </div>
              </div>

              {/* Item details */}
              <div className="border-t border-b border-slate-900 py-3.5 space-y-3 font-mono text-[11px]">
                <div className="flex justify-between text-slate-500 uppercase tracking-widest text-[9px] pb-1.5 border-b border-slate-900/60">
                  <span>Authorized Items</span>
                  <span>Charges (RWF)</span>
                </div>
                
                <div className="flex justify-between">
                  <span>SmartPay API Payment Routing Utility</span>
                  <span className="font-bold text-slate-300">RWF {Math.round(selectedInvoice.amount * 0.9).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>ISO-8583 Card settlement surcharge</span>
                  <span className="font-bold text-slate-300">RWF {Math.round(selectedInvoice.amount * 0.1).toLocaleString()}</span>
                </div>

                <div className="border-t border-slate-900 pt-2 flex justify-between font-sans text-xs">
                  <span className="font-medium text-slate-400">Total Indicated Bill:</span>
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-display">RWF {Math.round(selectedInvoice.amount).toLocaleString()}</span>
                </div>
              </div>

              {/* Status reference and printing simulation */}
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 font-mono">Invoice Date: {selectedInvoice.issueDate}</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 flex items-center gap-1 text-[10px] transition cursor-pointer"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print PDF</span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-mono">
                  Gateway sandbox invoices support fully compliant credit route simulation logs.
                </p>
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-500 py-20 font-mono">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-400" />
              Awaiting invoice selection from table listing...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
