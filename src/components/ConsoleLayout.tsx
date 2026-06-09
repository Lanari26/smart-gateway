import React, { useState } from 'react';
import {
  ActiveScreen,
  ConsoleTab,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  LayoutDashboard,
  FolderGit,
  BadgeDollarSign,
  Terminal,
  FileText,
  Sliders,
  CreditCard,
  ArrowLeft,
  Bell,
  BookOpen,
  LogOut
} from 'lucide-react';

// Child Tab components
import DashboardTab from './tabs/DashboardTab';
import ProjectsTab from './tabs/ProjectsTab';
import BillingTab from './tabs/BillingTab';
import DevelopersTab from './tabs/DevelopersTab';
import InvoicesTab from './tabs/InvoicesTab';
import AdminTab from './tabs/AdminTab';

interface ConsoleLayoutProps {
  onNavigate: (screen: ActiveScreen) => void;
}

export default function ConsoleLayout({ onNavigate }: ConsoleLayoutProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ConsoleTab>('dashboard');

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  // Sidebar Menu mapping
  const MENU_ITEMS = [
    { id: 'dashboard' as ConsoleTab, name: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'projects' as ConsoleTab, name: 'Project & Webhooks', icon: FolderGit },
    { id: 'billing' as ConsoleTab, name: 'Recursive Subscriptions', icon: BadgeDollarSign },
    { id: 'developers' as ConsoleTab, name: 'API Keys & AI Sandbox', icon: Terminal },
    { id: 'invoices' as ConsoleTab, name: 'Invoices Ledger', icon: FileText },
    { id: 'admin' as ConsoleTab, name: 'Administrative Routing', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row relative">
      
      {/* Sidebar Layout */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-900 bg-slate-950 flex flex-col justify-between shrink-0 z-20">
        <div className="p-5 space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-650 via-rose-500 to-amber-500 p-[2px] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Layers className="w-4.5 h-4.5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="font-display font-medium text-slate-200 tracking-wide text-sm block leading-none">SmartPay Console</span>
              <span className="text-[9px] font-mono text-indigo-400 block tracking-wider mt-1 leading-none">SANDBOX ACTIVE</span>
            </div>
          </div>

          <div className="border-t border-slate-900/60 my-4" />

          {/* Navigation Items */}
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  id={`side-menu-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white shadow shadow-indigo-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Outer control links */}
        <div className="p-4 bg-slate-950 border-t border-slate-900 space-y-2">
          {/* External Simulator CTA */}
          <button
            id="side-goto-checkout"
            onClick={() => onNavigate('checkout')}
            className="w-full py-2 px-3 rounded-lg text-[10px] font-bold text-center border border-indigo-505/20 text-indigo-400 bg-indigo-505/5 hover:bg-indigo-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Launch Checkout portal</span>
          </button>

          {/* Return button */}
          <button
            id="side-goto-landing"
            onClick={() => onNavigate('landing')}
            className="w-full py-2 px-3 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3 text-slate-650" />
            <span>Go to Landing Page</span>
          </button>

          {/* Signed-in identity + sign out */}
          <div className="pt-2 mt-1 border-t border-slate-900 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 font-mono truncate" title={user?.email}>
              {user?.name || user?.email}
            </span>
            <button
              id="side-logout"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-rose-400 hover:bg-rose-950/40 transition cursor-pointer shrink-0"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar header */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-md z-15">
          <div className="flex items-center space-x-4 max-w-md w-full">
            {/* Mock Global Project Selector */}
            <span className="text-xs text-slate-500 font-mono tracking-wider hidden sm:inline-block">ORG:</span>
            <div className="px-2.5 py-1 text-[11px] font-mono text-slate-300 bg-slate-950/80 border border-slate-900 rounded-lg select-all">
              smartpay_live_wayne_cave_93f
            </div>
          </div>

          <div className="flex items-center space-x-4">
            
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="referrer"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Dev API Docs</span>
            </a>

            {/* Quick simulated ping check */}
            <div className="text-[10px] uppercase font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 select-none leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>API LINK: UP</span>
            </div>

            {/* Notification triggers */}
            <button className="p-1.5 rounded-lg hover:bg-slate-900 hover:text-white text-slate-400 transition cursor-pointer relative" title="Gateway Alerts">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block absolute top-1 right-1" />
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Router */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab onNavigate={onNavigate} />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab />
          )}

          {activeTab === 'billing' && (
            <BillingTab />
          )}

          {activeTab === 'developers' && (
            <DevelopersTab />
          )}

          {activeTab === 'invoices' && (
            <InvoicesTab />
          )}

          {activeTab === 'admin' && (
            <AdminTab />
          )}
        </main>

      </div>

    </div>
  );
}
