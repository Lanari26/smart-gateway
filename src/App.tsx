import React, { useState } from 'react';
import { ActiveScreen } from './types';
import LandingPage from './components/LandingPage';
import CheckoutPage from './components/CheckoutPage';
import ConsoleLayout from './components/ConsoleLayout';
import AuthPage from './components/AuthPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, loading } = useAuth();
  // Allow deep links, e.g. a hosted-checkout URL: /?screen=checkout&key=pk_…
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(() => {
    try {
      const s = new URLSearchParams(window.location.search).get('screen');
      if (s === 'checkout' || s === 'console' || s === 'auth' || s === 'landing') {
        return s as ActiveScreen;
      }
    } catch {
      /* ignore */
    }
    return 'landing';
  });

  // Navigation that gates the console behind authentication.
  const navigate = (screen: ActiveScreen) => {
    if (screen === 'console' && !user) {
      setActiveScreen('auth');
      return;
    }
    setActiveScreen(screen);
  };

  if (loading) {
    return (
      <div className="bg-slate-950 text-slate-400 min-h-screen flex items-center justify-center font-sans text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {activeScreen === 'landing' && <LandingPage onNavigate={navigate} />}

      {activeScreen === 'checkout' && <CheckoutPage onNavigate={navigate} />}

      {activeScreen === 'auth' && (
        <AuthPage onNavigate={navigate} onAuthed={() => setActiveScreen('console')} />
      )}

      {activeScreen === 'console' && user && <ConsoleLayout onNavigate={navigate} />}

      {/* If a logged-out user lands on console somehow, send them to auth. */}
      {activeScreen === 'console' && !user && (
        <AuthPage onNavigate={navigate} onAuthed={() => setActiveScreen('console')} />
      )}
    </div>
  );
}
