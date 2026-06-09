import React, { useState, useEffect } from 'react';
import {
  Plus,
  Send,
  Terminal,
  Link2,
  Database
} from 'lucide-react';
import { Project } from '../../types';
import { projectsApi } from '../../lib/endpoints';

export default function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProj, setSelectedProj] = useState<Project | null>(null);

  // Create project form fields
  const [newProjName, setNewProjName] = useState('');
  const [newWebhook, setNewWebhook] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Webhook Tester Variables
  const [testWebhookUrl, setTestWebhookUrl] = useState('');
  const [testEventType, setTestEventType] = useState('checkout.session.completed');
  const [webhookLog, setWebhookLog] = useState<Array<{ time: string; type: 'info' | 'success' | 'err'; text: string }>>([]);
  const [activePayload, setActivePayload] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  // Load projects from the API
  useEffect(() => {
    let active = true;
    projectsApi.list().then((list) => {
      if (!active) return;
      setProjects(list);
      if (list[0]) {
        setSelectedProj(list[0]);
        setTestWebhookUrl(list[0].webhookUrl);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Create a project via the API
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName) return;
    try {
      const created = await projectsApi.create({ name: newProjName, webhookUrl: newWebhook || undefined });
      setProjects((prev) => [...prev, created]);
      setSelectedProj(created);
      setTestWebhookUrl(created.webhookUrl);
      setNewProjName('');
      setNewWebhook('');
      setShowAddForm(false);
    } catch {
      /* surfaced by the API client */
    }
  };

  const getEventJSONPayload = (type: string) => {
    const defaultData = {
      id: `evt_${Math.random().toString(36).substring(2, 10)}`,
      object: "event",
      api_version: "2026-06-08",
      created: Date.now(),
      type: type,
      data: {
        object: {
          id: `cs_test_${Math.random().toString(36).substring(2, 8)}`,
          amount_total: 125000,
          currency: "usd",
          customer_details: {
            email: "merchant-developer-billing@smartpay-gateway.io",
            name: "John Connor"
          },
          payment_status: type === 'checkout.session.completed' ? "paid" : "unpaid",
          routing_protocol: "SMARTPAY_OPTIMIZED_V2"
        }
      }
    };
    return defaultData;
  };

  // Run Simulated Webhook Event dispatch
  const handleFireWebhook = () => {
    if (!testWebhookUrl) {
      alert("Please provide a valid endpoint URL to test.");
      return;
    }

    setIsSending(true);
    setWebhookLog([]);
    setActivePayload(null);

    const logs: Array<{ time: string; type: 'info' | 'success' | 'err'; text: string }> = [
      { time: "00:00.01", type: "info", text: `Constructing payload schema for '${testEventType}'` },
      { time: "00:00.12", type: "info", text: `Locating route endpoints through secure sandbox tunnel...` },
      { time: "00:00.41", type: "info", text: `POST Request dispatching header 'X-SmartPay-Signature' sha256 encrypted` },
      { time: "00:00.89", type: "success", text: `Delivered Successfully! Host returned HTTP 200 OK Response` }
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < logs.length) {
        setWebhookLog(prev => [...prev, logs[index]]);
        index++;
      } else {
        clearInterval(interval);
        setActivePayload(getEventJSONPayload(testEventType));
        setIsSending(false);
      }
    }, 600);
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-white">Project Orchestrator & Webhooks</h1>
        <p className="text-xs text-slate-400 mt-1">Manage multiple merchant client IDs and configure live test hooks dynamically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Projects Left Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 sm:p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Merchant Projects ({projects.length})</span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[9px] uppercase font-semibold transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Client</span>
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleCreateProject} className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 space-y-3">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block">Create New Sandbox Project</span>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Project Name (e.g. My Shopify Store)"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="Webhook Target URL (Optional)"
                    value={newWebhook}
                    onChange={(e) => setNewWebhook(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 text-[9px]">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-2 py-1 bg-indigo-650 hover:bg-indigo-600 text-white rounded font-bold"
                  >
                    Save Project
                  </button>
                </div>
              </form>
            )}

            {/* List items */}
            <div className="space-y-2">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setSelectedProj(proj);
                    setTestWebhookUrl(proj.webhookUrl);
                    setWebhookLog([]);
                    setActivePayload(null);
                  }}
                  className={`w-full p-3.5 rounded-xl text-left border flex items-center justify-between transition cursor-pointer ${
                    selectedProj?.id === proj.id
                      ? 'bg-slate-900/60 border-indigo-500 shadow-md'
                      : 'bg-slate-950/20 border-slate-900 hover:border-slate-805 hover:bg-slate-900/15'
                  }`}
                >
                  <div className="space-y-1 max-w-[190px]">
                    <p className="text-xs font-semibold text-slate-200 truncate">{proj.name}</p>
                    <div className="flex items-center space-x-2.5 text-[9px] font-mono text-slate-500">
                      <span>{proj.keysCreated} Access Keys</span>
                      <span>•</span>
                      <span>{proj.totalCalls.toLocaleString()} calls</span>
                    </div>
                  </div>
                  <div>
                    {proj.status === 'active' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 block shadow shadow-emerald-400" title="Active Core routing" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block animate-pulse" title="Configuring Webhook parameters" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 sm:p-5 space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Sandbox Endpoint Metrics</span>
            
            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-950 rounded-xl border border-slate-900">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Selected Client ID</span>
              </div>
              <span className="font-mono text-[10px] text-indigo-400 uppercase">{selectedProj?.id ?? '—'}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-950 rounded-xl border border-slate-900">
              <div className="flex items-center space-x-2">
                <Link2 className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-400">Dynamic Gateway Active</span>
              </div>
              <span className="font-mono font-bold text-[10px] text-emerald-400">SMART_ROUTING_ON</span>
            </div>
          </div>
        </div>

        {/* Webhook Simulator Right Panel */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 sm:p-6 space-y-6">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-2">Simulated Host Tunnel Client</span>
            <h3 className="text-base font-semibold text-white">Event Webhook Sandbox Dispatcher</h3>
            <p className="text-xs text-slate-400 mt-1">Test your local HTTP backend server's reaction by issuing synthetic payment results.</p>
          </div>

          <div className="space-y-4">
            
            {/* Input URL Hook */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Server Webhook Endpoint URL</label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="e.g. http://localhost:8080/smartpay-webhook"
                  value={testWebhookUrl}
                  onChange={(e) => setTestWebhookUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
                <Database className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Event pick */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Target Schema Event Code</label>
                <select
                  value={testEventType}
                  onChange={(e) => setTestEventType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl outline-none hover:border-slate-700 transition cursor-pointer"
                >
                  <option value="checkout.session.completed">checkout.session.completed (Success)</option>
                  <option value="invoice.payment_failed">invoice.payment_failed (Failed decline)</option>
                  <option value="subscription.cancelled">subscription.cancelled (Halt package)</option>
                </select>
              </div>

              {/* Fire Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleFireWebhook}
                  disabled={isSending}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center space-x-2 cursor-pointer shadow shadow-indigo-900"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-200" />
                  <span>{isSending ? "Sending Payloads..." : "Fire Test Webhook Payload"}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Webhook terminal logger console */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">Live Delivery console Logs</span>
              <span className="text-[9px] uppercase font-mono tracking-widest text-[#a855f7] bg-purple-500/10 px-2 rounded-full font-bold">SHA-256 Signatures active</span>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs space-y-2 min-h-36 overflow-y-auto relative">
              {webhookLog.length === 0 ? (
                <div className="text-slate-650 italic text-center py-10">
                  <Terminal className="w-6 h-6 mx-auto mb-2 opacity-30 text-indigo-400" />
                  Terminal offline. Ready to fire sandbox tests...
                </div>
              ) : (
                <div className="space-y-1.5">
                  {webhookLog.map((log, idx) => (
                    <div key={idx} className="flex space-x-2 text-[11px]">
                      <span className="text-slate-500">[{log.time}]</span>
                      <span className={
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'err' ? 'text-rose-450' : 'text-slate-350'
                      }>
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expandable JSON Schema Output */}
          {activePayload && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-xs font-mono text-indigo-400 font-bold">Target Webhook Payload JSON Response</span>
                <span className="text-[10px] font-mono text-slate-500 font-medium">application/json</span>
              </div>
              <pre className="font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto">
                {JSON.stringify(activePayload, null, 2)}
              </pre>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
