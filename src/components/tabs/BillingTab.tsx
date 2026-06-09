import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings2, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  AlertCircle, 
  BadgeDollarSign, 
  PlusCircle,
  HelpCircle,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { BillingPlan, SubscriptionCustomer } from '../../types';
import { plansApi, subscriptionsApi } from '../../lib/endpoints';

export default function BillingTab() {
  // Live data
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriptionCustomer[]>([]);

  // Form Field
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(29);
  const [planDesc, setPlanDesc] = useState('');
  const [planCycle, setPlanCycle] = useState<'Monthly' | 'Yearly' | 'Quarterly'>('Monthly');

  // Load from the API on mount
  useEffect(() => {
    let active = true;
    plansApi.list().then((p) => active && setPlans(p)).catch(() => undefined);
    subscriptionsApi.list().then((s) => active && setSubscribers(s)).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Create a plan via the API
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName) return;
    try {
      const created = await plansApi.create({
        name: planName,
        price: planPrice,
        cycle: planCycle,
        description: planDesc || 'No manual description provided for model.',
        isScalable: true,
      });
      setPlans((prev) => [...prev, created]);
      setPlanName('');
      setPlanPrice(29);
      setPlanDesc('');
      setShowPlanForm(false);
    } catch {
      /* surfaced by the API client */
    }
  };

  // Delete a plan via the API
  const handleDeletePlan = async (id: string) => {
    try {
      await plansApi.remove(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch {
      /* ignore */
    }
  };

  // Pause (Active -> Pending) / Resume (Pending -> Active), persisted via the API.
  const toggleSubscriberStatus = async (id: string, currentStatus: 'Active' | 'Pending' | 'Cancelled') => {
    const nextStatus: 'Active' | 'Pending' = currentStatus === 'Active' ? 'Pending' : 'Active';
    try {
      const updated = await subscriptionsApi.setStatus(id, nextStatus);
      setSubscribers((prev) => prev.map((sub) => (sub.id === id ? updated : sub)));
    } catch {
      /* ignore */
    }
  };

  const cancelSubscriber = async (id: string) => {
    try {
      const updated = await subscriptionsApi.cancel(id);
      setSubscribers((prev) => prev.map((sub) => (sub.id === id ? updated : sub)));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-white">Automated Subscription Billing</h1>
          <p className="text-xs text-slate-400 mt-1">Configure recursive subscription packages, checkout plans, and examine recurring client actions.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowPlanForm(!showPlanForm)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 text-white transition cursor-pointer shadow shadow-indigo-900"
        >
          <PlusCircle className="w-4 h-4 text-indigo-200" />
          <span>Create Subscription Plan</span>
        </button>
      </div>

      {showPlanForm && (
        <form onSubmit={handleCreatePlan} className="bg-slate-900/60 p-5 rounded-2xl border border-indigo-500/30 max-w-2xl space-y-4">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider block">Custom Plan Configurator</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-slate-350 block mb-1">Package Plan Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Premium Enterprise Cluster"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-550"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-350 block mb-1">Price per cycle (USD)</label>
              <input
                type="number"
                min={1}
                required
                value={planPrice}
                onChange={(e) => setPlanPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-550 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-slate-350 block mb-1">Billing Interval</label>
              <select
                value={planCycle}
                onChange={(e) => setPlanCycle(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-550 cursor-pointer"
              >
                <option value="Monthly">Monthly Cycle</option>
                <option value="Quarterly">Quarterly Cycle</option>
                <option value="Yearly">Yearly Cycle</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-350 block mb-1">Brief Description</label>
              <input
                type="text"
                placeholder="Unlimited endpoints, automated route failcovers..."
                value={planDesc}
                onChange={(e) => setPlanDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-550"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPlanForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Assemble Plan Layout
            </button>
          </div>
        </form>
      )}

      {/* Package plans visual bento layout */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400">Available Gateway Plans ({plans.length})</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className="bg-slate-900/40 border border-slate-900 hover:border-slate-805 rounded-2xl p-5 flex flex-col justify-between h-48 relative overflow-hidden group transition"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-550/5 rounded-full -translate-y-8 translate-x-8 blur-xl pointer-events-none" />
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-200">{plan.name}</span>
                  <span className="text-[9px] font-mono text-indigo-400 bg-indigo-550/10 px-2 py-0.5 rounded-full border border-indigo-900/30 uppercase font-bold">{plan.cycle}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 pr-2">{plan.description}</p>
              </div>

              <div className="space-y-3 mt-4">
                <div className="font-display flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-white">${plan.price}</span>
                  <span className="text-xs text-slate-500 font-mono"> / {plan.cycle === 'Monthly' ? 'mo' : plan.cycle === 'Quarterly' ? 'quarter' : 'yr'}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                  <span>{plan.subscribers} Live subscribers</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-slate-600 hover:text-rose-400 hover:scale-105 transition cursor-pointer"
                    title="Terminate pricing package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {plan.isPopular && (
                <span className="absolute top-2 right-2 text-[8px] tracking-widest font-mono font-bold bg-indigo-500 text-white px-2 py-0.5 rounded">POPULAR</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subscriber List Tables */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Active Customer Billing Accounts</h3>
          <p className="text-xs text-slate-400 mt-0.5">Control subscriptions, pause recurring balance calculations, or trigger cancellations.</p>
        </div>

        <div className="bg-slate-900/10 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/80 text-[10px] font-mono tracking-wider uppercase text-slate-500 bg-slate-950/40">
                  <th className="px-5 py-3">Customer Acc</th>
                  <th className="px-5 py-3">Subscribed block</th>
                  <th className="px-5 py-3">Recurring cost</th>
                  <th className="px-5 py-3">Registration Status</th>
                  <th className="px-5 py-3">Next Settlement Date</th>
                  <th className="px-5 py-3 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs">
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500 font-mono">
                      No customer billing accounts registered.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-900/20 transition">
                      
                      {/* Name Details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${sub.avatarColor}`}>
                            {sub.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{sub.name}</p>
                            <span className="text-[10px] text-slate-450 font-mono block leading-none mt-0.5">{sub.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Plan subscribed */}
                      <td className="px-5 py-3.5 font-sans font-medium text-indigo-355">
                        {sub.planName}
                      </td>

                      {/* Cost */}
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-300">
                        ${sub.amount}/mo
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {sub.status === 'Active' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                            ACTIVE
                          </span>
                        )}
                        {sub.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-500 bg-amber-955/30 border border-amber-900/30 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-amber-500 rounded-full" />
                            PAUSED
                          </span>
                        )}
                        {sub.status === 'Cancelled' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-zinc-400 bg-[#1e293b] border border-slate-800 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 bg-zinc-400 rounded-full" />
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Next bill */}
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {sub.nextBilling}
                      </td>

                      {/* Pause/Cancel/Resume items */}
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {sub.status !== 'Cancelled' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleSubscriberStatus(sub.id, sub.status)}
                              className={`px-2 py-1 text-[10px] font-semibold rounded border transition cursor-pointer ${
                                sub.status === 'Active'
                                  ? 'bg-slate-950 border-slate-805 text-slate-400 hover:text-amber-500 hover:border-amber-900/30'
                                  : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-450 hover:bg-emerald-900/20'
                              }`}
                            >
                              {sub.status === 'Active' ? 'Pause Sub' : 'Resume Sub'}
                            </button>

                            <button
                              type="button"
                              onClick={() => cancelSubscriber(sub.id)}
                              className="px-2 py-1 text-[10px] font-semibold rounded border border-slate-905 bg-slate-950 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/30 transition cursor-pointer"
                            >
                              Terminate Plan
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600 italic">Terminated</span>
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
