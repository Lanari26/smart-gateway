import React, { useState, useEffect } from 'react';
import {
  Plus,
  Copy,
  Check,
  Trash2,
  Terminal,
  Code2,
} from 'lucide-react';
import { ApiKey, WhitelistedIp } from '../../types';
import { apiKeysApi, whitelistApi } from '../../lib/endpoints';
import { apiUrl } from '../../lib/api';

// Live integration snippets for the hosted-checkout payment API. The `code`
// block is a clean, copy-paste-ready curl (real deployed URL, no placeholders)
// that imports cleanly into Postman / apidog; `response` is the example reply,
// shown separately so it never ends up inside the copied command.
function buildSnippets(): { label: string; code: string; response: string }[] {
  const base = apiUrl(''); // e.g. https://api-pay.lanari.rw/api
  return [
    {
      label: 'Request a Mobile Money payment (with split payout)',
      code: `curl -X POST "${base}/payments/momo" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_test_your_secret_key" \\
  -d '{
  "customerName": "Alex Rivera",
  "customerEmail": "alex@example.com",
  "phone": "0788000000",
  "amount": 1000,
  "note": "invoice-1234",
  "recipients": [
    { "phone": "0788111111", "percent": 60 },
    { "phone": "0738222222", "percent": 40 }
  ]
}'`,
      response: `201 Created  { "transaction": { "reference": "tx_8f9e1a", "status": "pending" }, "accepted": true }

# The gateway takes 4% off the gross, so net = 1000 - 4% = 960 RWF.
# Once the charge is approved, 60% (576) and 40% (384) are transferred
# automatically to the two numbers. Poll the status to watch it settle.`,
    },
    {
      label: 'Poll the payment + transfer status',
      code: `curl "${base}/payments/tx_8f9e1a/status"`,
      response: `{ "transaction": { "status": "pending", "transferStatus": "PENDING",
  "message": "Payment pending — awaiting approval." } }
# repeat until paid + transfer done:
{ "transaction": { "status": "paid", "transferStatus": "SUCCESSFUL",
  "netAmount": 960, "recipients": [ { "phone": "0788111111", "amount": 576, "status": "SUCCESSFUL" }, … ],
  "message": "Payment successful, transfer successful." } }`,
    },
    {
      label: 'Generate a hosted card link',
      code: `curl -X POST "${base}/payments/card" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_test_your_secret_key" \\
  -d '{
  "customerName": "Alex Rivera",
  "email": "alex@example.com",
  "amount": 5000
}'`,
      response: `201 Created
{
  "transaction": { "reference": "tx_2e41c4", "status": "pending", "method": "Card" },
  "link": "https://pay.itecpay.rw/api/pay/apis/pesapal/index?PCODE=RMUKRM11MEQF1MLI2N7V",
  "validUntil": "2026-06-09 14:42:27"
}`,
    },
  ];
}

export default function DevelopersTab() {
  const SNIPPETS = buildSnippets();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [ips, setIps] = useState<WhitelistedIp[]>([]);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'PUBLIC' | 'SECRET'>('PUBLIC');
  const [showKeyForm, setShowKeyForm] = useState(false);

  const [newIpAddr, setNewIpAddr] = useState('');
  const [newIpLabel, setNewIpLabel] = useState('');
  const [showIpForm, setShowIpForm] = useState(false);

  const [copiedKeyId, setCopiedKeyId] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(-1);

  useEffect(() => {
    let active = true;
    apiKeysApi.list().then((k) => active && setApiKeys(k)).catch(() => undefined);
    whitelistApi.list().then((i) => active && setIps(i)).catch(() => undefined);
    return () => { active = false; };
  }, []);

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

  const handleCopySnippet = (idx: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(idx);
    setTimeout(() => setCopiedSnippet(-1), 1500);
  };

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

  return (
    <div className="space-y-8 font-sans">

      {/* Header section info */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-white">Developer API Console</h1>
        <p className="text-xs text-slate-400 mt-1">Manage payment access credentials, whitelist API server ingress addresses, and integrate the hosted checkout API.</p>
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

          {/* Secure IP Ingress Whitelist */}
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

        {/* Integration Quickstart (Right Column) */}
        <div className="lg:col-span-6 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-450 block leading-none">Hosted Checkout API</span>
              <span className="text-sm font-semibold text-white font-display block mt-0.5">Integration Quickstart</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Authenticate every charge with your <span className="text-indigo-300 font-mono">X-API-Key</span>
            {' '}(SECRET key server-side; PUBLIC/publishable key for the hosted checkout link).
            The charge is recorded under that key's merchant. URLs are pre-filled for this
            environment — copy a command straight into Postman or apidog and swap in your key.
          </p>

          <div className="space-y-4">
            {SNIPPETS.map((snippet, idx) => (
              <div key={idx} className="bg-slate-950/90 rounded-xl border border-slate-850 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-850/70">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{snippet.label}</span>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet(idx, snippet.code)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-850 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                    title="Copy curl command"
                  >
                    {copiedSnippet === idx ? (
                      <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[9px] text-emerald-400">Copied</span></>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /><span className="text-[9px]">Copy</span></>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 text-[11px] leading-relaxed font-mono text-slate-300 overflow-x-auto whitespace-pre">
{snippet.code}
                </pre>
                <div className="px-3.5 py-2 border-t border-slate-850/70 bg-slate-950/60">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Example response</span>
                  <pre className="text-[10px] leading-relaxed font-mono text-slate-500 overflow-x-auto whitespace-pre">
{snippet.response}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
