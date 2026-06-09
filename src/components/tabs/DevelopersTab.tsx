import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldAlert, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Terminal, 
  Play, 
  Cpu, 
  Database,
  ArrowRight,
  RefreshCw,
  MessageSquareCode
} from 'lucide-react';
import { ApiKey, WhitelistedIp } from '../../types';
import { apiKeysApi, whitelistApi } from '../../lib/endpoints';

const QUICK_PROMPTS = [
  { label: "cURL Checkout Session", prompt: "Generate a cURL request to create a secure checkout session with an amount of $89.00 USD, dynamic billing parameters, and a custom metadata tag containing 'customerId: cust_alexrivera'." },
  { label: "Webhook Signature TS", prompt: "Create a TypeScript Express helper to securely parse and verify the SmartPay webhook signature header 'X-SmartPay-Signature' using HMAC SHA256." },
  { label: "Card Decline Handler", prompt: "Format a clean JSON sample structure for a card decline response containing ISO-8583 codes, decline reason '51_insufficient_funds', and suggestions for merchant logging." },
  { label: "Multi-Currency Intent", prompt: "Explain how to structure a multi-currency JSON payment intent routing payload across both EUR and USD inside the SmartPay Gateway." }
];

export default function DevelopersTab() {
  // Synchronized state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [ips, setIps] = useState<WhitelistedIp[]>([]);

  // Key Creator field
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'PUBLIC' | 'SECRET'>('PUBLIC');
  const [showKeyForm, setShowKeyForm] = useState(false);

  // IP Creator field
  const [newIpAddr, setNewIpAddr] = useState('');
  const [newIpLabel, setNewIpLabel] = useState('');
  const [showIpForm, setShowIpForm] = useState(false);

  // Copied indicator tracker
  const [copiedKeyId, setCopiedKeyId] = useState('');

  // AI Chat Sandbox Integration Variables
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState('');

  // Load from the API on mount
  useEffect(() => {
    let active = true;
    apiKeysApi.list().then((k) => active && setApiKeys(k)).catch(() => undefined);
    whitelistApi.list().then((i) => active && setIps(i)).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Create a key (token generated server-side)
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    try {
      const created = await apiKeysApi.create({ label: newKeyName, type: newKeyType, mode: 'test' });
      setApiKeys((prev) => [...prev, created]);
      setNewKeyName('');
      setShowKeyForm(false);
    } catch {
      /* surfaced by the API client */
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await apiKeysApi.remove(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleCopyToken = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(''), 1500);
  };

  // Add whitelisted server ingress IP
  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpAddr) return;
    try {
      const created = await whitelistApi.create({ ip: newIpAddr, label: newIpLabel || 'Authorized Server Node' });
      setIps((prev) => [...prev, created]);
      setNewIpAddr('');
      setNewIpLabel('');
      setShowIpForm(false);
    } catch {
      /* ignore */
    }
  };

  const handleDeleteIp = async (id: string) => {
    try {
      await whitelistApi.remove(id);
      setIps((prev) => prev.filter((ip) => ip.id !== id));
    } catch {
      /* ignore */
    }
  };

  // Call the server side Express Gemini Gateway Route
  const handleQueryAiSandbox = async (targetPrompt: string) => {
    if (!targetPrompt.trim()) return;

    setIsLoadingAi(true);
    setAiResponse('');
    setErrorAi('');

    try {
      const response = await fetch('/api/ai/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to contact Gemini routing daemon backend");
      }

      setAiResponse(data?.text || "The sandbox AI generator processed complete but returned a blank token response.");
    } catch (err: any) {
      console.error(err);
      setErrorAi(err?.message || "An error occurred with sandbox APIs. Please check whether server.ts is running.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header section info */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-white">Developer API Console</h1>
        <p className="text-xs text-slate-400 mt-1">Manage payment access credentials, whitelist API server ingress addresses, and consult our real-time smart integration co-pilot.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* API Credentials and Whitelists (Left Column) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* API Keys Panel */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 sm:p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Security Access tokens ({apiKeys.length})</span>
              <button
                type="button"
                onClick={() => setShowKeyForm(!showKeyForm)}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[9px] font-bold uppercase transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Create Token</span>
              </button>
            </div>

            {showKeyForm && (
              <form onSubmit={handleCreateApiKey} className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 space-y-3">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block">Dynamic Token Generator</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Access Key Label (e.g., Shop Backend)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <select
                      value={newKeyType}
                      onChange={(e) => setNewKeyType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 px-2 py-1.5 rounded outline-none h-full cursor-pointer"
                    >
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="SECRET">SECRET</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-[9px]">
                  <button 
                    type="button" 
                    onClick={() => setShowKeyForm(false)}
                    className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 text-white rounded font-bold"
                  >
                    Generate Credentials
                  </button>
                </div>
              </form>
            )}

            {/* Keys Listing */}
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="space-y-1.5 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        key.type === 'PUBLIC' 
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-450'
                      }`}>
                        {key.type}
                      </span>
                      <span className="text-xs text-slate-200 font-sans font-medium truncate sm:max-w-xs">{key.label}</span>
                    </div>
                    {/* Token content preview masking */}
                    <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded text-[10px] font-mono text-slate-400 select-all max-w-full overflow-hidden">
                      <span className="truncate">{key.token}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyToken(key.id, key.token)}
                      className="p-1 px-1.5 rounded bg-slate-900 hover:bg-slate-850 hover:text-indigo-400 border border-slate-85 y-0.5 transition cursor-pointer relative"
                      title="Copy Key Token"
                    >
                      {copiedKeyId === key.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="p-1 px-1.5 rounded bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-85 transition cursor-pointer"
                      title="Revoke Credentials"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure IP Ingress Whitelist Whitelisting */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 sm:p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Server Ingress Whitelists ({ips.length})</span>
              <button
                type="button"
                onClick={() => setShowIpForm(!showIpForm)}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-mono text-[9px] font-bold uppercase transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Register Server</span>
              </button>
            </div>

            {showIpForm && (
              <form onSubmit={handleAddIp} className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 space-y-3">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block">Register Endpoint Server IP</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="IP Address (e.g. 54.21.32.12)"
                    value={newIpAddr}
                    onChange={(e) => setNewIpAddr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Reference Label (e.g. main server)"
                    value={newIpLabel}
                    onChange={(e) => setNewIpLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 text-[9px]">
                  <button 
                    type="button" 
                    onClick={() => setShowIpForm(false)}
                    className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 text-white rounded font-bold"
                  >
                    Authorize IP Block
                  </button>
                </div>
              </form>
            )}

            {/* IPs Listing */}
            <div className="space-y-2">
              {ips.map((ipObj) => (
                <div key={ipObj.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 max-w-[80%]">
                    <Terminal className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="truncate">
                      <p className="font-mono text-xs text-slate-200 tracking-wide font-semibold">{ipObj.ip}</p>
                      <p className="text-[9px] text-slate-500 uppercase mt-0.5 font-sans tracking-wide truncate">{ipObj.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteIp(ipObj.id)}
                    className="p-1 px-1.5 rounded bg-slate-900 hover:bg-rose-950/15 hover:text-rose-400 border border-slate-85 transition cursor-pointer"
                    title="Revoke Node Access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* AI Integration Co-Pilot Prompt (Right Column) */}
        <div className="lg:col-span-6 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 sm:p-6 space-y-6 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-550/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none animate-pulse" />
          
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <MessageSquareCode className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-450 block leading-none">AI Integration Daemon</span>
                <span className="text-sm font-semibold text-white font-display block mt-0.5">SmartPay SDK Co-Pilot Sandbox</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-6">Type custom integration questions or select a pre-populated billing task query to call our Gemini backend API helper.</p>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(qp.prompt);
                    handleQueryAiSandbox(qp.prompt);
                  }}
                  disabled={isLoadingAi}
                  className="p-2.5 rounded-lg text-left bg-slate-950/85 border border-slate-850 hover:border-indigo-500/30 text-slate-350 hover:text-indigo-400 hover:bg-slate-900/20 text-[10px] font-medium leading-normal cursor-pointer transition flex flex-col justify-between align-start h-16 disabled:opacity-50"
                >
                  <span className="font-mono text-[9px] uppercase font-semibold text-slate-500">{qp.label}</span>
                  <span className="inline-flex items-center space-x-1.5 font-bold uppercase mt-1 leading-none text-right w-full justify-end text-slate-400 hover:text-indigo-400 text-[8px] font-sans">
                    <span>Draft Query</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </button>
              ))}
            </div>

            {/* Chat output terminal box */}
            <div className="space-y-4">
              <div className="bg-slate-950/90 rounded-xl border border-slate-850 p-4 font-mono text-[11px] leading-relaxed relative min-h-44 text-slate-300">
                {isLoadingAi && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 rounded-xl">
                    <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span className="text-xs font-mono text-indigo-400">Gemini model drafting payment response...</span>
                  </div>
                )}

                {errorAi && (
                  <div className="p-3 bg-rose-950/30 border border-rose-900/30 rounded text-rose-450 space-y-1.5">
                    <p className="font-bold">Backend Route Handshake Fail</p>
                    <p className="text-slate-400 text-[10px]" style={{ whiteSpace: "pre-wrap" }}>{errorAi}</p>
                  </div>
                )}

                {!aiResponse && !errorAi && !isLoadingAi && (
                  <div className="text-slate-600 text-center py-12 italic">
                    <Sparkles className="w-5 h-5 text-amber-400 inline-block mb-1 opacity-60" />
                    <p className="text-slate-500">Awaiting prompt selection. Tap details or draft query above to trigger.</p>
                  </div>
                )}

                {aiResponse && (
                  <div className="whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-slate-800">
                    {aiResponse}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Prompt Form input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleQueryAiSandbox(prompt);
            }} 
            className="flex items-center gap-2 pt-4 border-t border-slate-900 mt-4"
          >
            <input
              type="text"
              placeholder="Ask helper: Draft typescript payout routine..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-sans"
            />
            <button
              type="submit"
              disabled={isLoadingAi || !prompt.trim()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold hover:border-indigo-450 flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer shrink-0 shadow shadow-indigo-900"
            >
              <span>Ask Co-Pilot</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
