import React, { useState } from 'react';
import { 
  Sliders, 
  Workflow, 
  Layers, 
  TrendingUp, 
  Cpu, 
  ShieldAlert, 
  CheckCircle, 
  Activity, 
  Play, 
  Clock,
  Settings2,
  Database
} from 'lucide-react';
import { StorageManager } from '../../mockData';

export default function AdminTab() {
  // Config States
  const [feeMarkup, setFeeMarkup] = useState<number>(() => StorageManager.get<number>('admin_markup', 1.5));
  const [routingPreference, setRoutingPreference] = useState<string>(() => StorageManager.get<string>('admin_routing', 'lowest-cost'));
  const [simulationSpeed, setSimulationSpeed] = useState<number>(() => StorageManager.get<number>('admin_speed', 1200));

  const handleSaveConfigs = () => {
    StorageManager.set('admin_markup', feeMarkup);
    StorageManager.set('admin_routing', routingPreference);
    StorageManager.set('admin_speed', simulationSpeed);
    alert("SmartPay Gateway route configurations have been successfully updated in localized memory!");
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-white">Gateway Administrative Configurations</h1>
        <p className="text-xs text-slate-400 mt-1">Configure global routing algorithms, simulate processing delays, and inspect real-time server network sync health lines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Core Settings (Left Column) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 sm:p-6 space-y-6">
            
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 bg-indigo-505/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Merchant Fee Surcharging Rules</h3>
            </div>

            {/* Fee Surcharge Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>SmartPay Protocol Interchange Fee</span>
                <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-350 to-indigo-200">{feeMarkup.toFixed(2)} %</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={feeMarkup}
                onChange={(e) => setFeeMarkup(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-850 rounded appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                This rule modifies the dynamic route fee calculations displayed in the Sandbox Checkout Portal. Standard acquirers default to 2.9% + 30¢.
              </p>
            </div>

            <div className="border-t border-slate-850 my-6" />

            {/* Routing Optimization Rules */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Workflow className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Select Automated Routing Algorithm</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: 'lowest-cost',
                    title: "Lowest-Cost Route Selector",
                    desc: "Intelligently routes transactions through acquiring bank networks returning the lowest interchange settlement cost parameters."
                  },
                  {
                    id: 'latency-aware',
                    title: "Latency-Aware Speed routing",
                    desc: "Checks acquirer API endpoints every 10 seconds and routes transactions through networks returning pings below <50ms."
                  },
                  {
                    id: 'high-converting',
                    title: "Maximum Conversions Failcover",
                    desc: "Prioritizes historical card issuer success rate data and dynamically switches acquirers when authorization rates dip below 98%."
                  }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRoutingPreference(opt.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      routingPreference === opt.id
                        ? 'bg-indigo-650/15 border-indigo-500 shadow'
                        : 'bg-slate-950/40 border-slate-905 hover:bg-slate-900/30'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-200 block">{opt.title}</span>
                    <span className="text-[10px] text-slate-450 block leading-snug mt-1 pr-2">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-850 my-6" />

            {/* Sandbox Simulation delay speed */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Sandbox Network Transaction Delay</span>
                <span className="font-mono font-bold text-slate-200">{(simulationSpeed / 1000).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="400"
                max="4000"
                step="200"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-850 rounded appearance-none cursor-pointer accent-indigo-550"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Determine the synthetic speed delay that the Sandbox Checkout screen pauses to simulate acquirer handshakes.
              </p>
            </div>

            {/* Save Buttons */}
            <button
              type="button"
              onClick={handleSaveConfigs}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer shadow shadow-indigo-900"
            >
              Update Routing Configurations
            </button>

          </div>
        </div>

        {/* Telemetry network logs (Right Column) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 sm:p-6 space-y-6">
            
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 bg-emerald-505/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white font-sans">Acquirer Core Health Dials</h3>
            </div>

            <div className="space-y-4 text-xs font-sans">
              
              {/* Stripe Sandbox */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 block animate-pulse" />
                  <div>
                    <span className="font-semibold text-slate-200 font-mono text-[11px] block">Stripe Sandbox Processing Network</span>
                    <span className="text-[10px] text-slate-500 block leading-none mt-0.5">Clearing: ISO-27001 Tunnel</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-900/30">ONLINE | 24ms</span>
              </div>

              {/* VisaNet auth exchange */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 block animate-pulse" />
                  <div>
                    <span className="font-semibold text-slate-200 font-mono text-[11px] block">VisaNet Authorization Exchange</span>
                    <span className="text-[10px] text-slate-500 block leading-none mt-0.5">Clearing: Dual message protocol (3D-Secure)</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-900/30">ONLINE | 42ms</span>
              </div>

              {/* Master Interchange */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 block animate-pulse" />
                  <div>
                    <span className="font-semibold text-slate-200 font-mono text-[11px] block">Mastercard Banknet Interlock</span>
                    <span className="text-[10px] text-slate-500 block leading-none mt-0.5">Clearing: Single message instant settlement</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-900/30">ONLINE | 35ms</span>
              </div>

              {/* Amex clearing */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 block animate-pulse" />
                  <div>
                    <span className="font-semibold text-slate-200 font-mono text-[11px] block">American Express Direct Route Settle</span>
                    <span className="text-[10px] text-slate-500 block leading-none mt-0.5">Clearing: OptBlue integrated settlement</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-900/30">ONLINE | 58ms</span>
              </div>

            </div>

            {/* Quick telemetry note */}
            <div className="p-3.5 bg-yellow-505/10 border border-yellow-900/30 text-yellow-300 text-[10px] leading-relaxed rounded-xl flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="font-mono">
                Admin Settings and Acquiring rules reside inside transient cache memory blocks. Changes dynamically cascade to checkout routines immediately!
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
