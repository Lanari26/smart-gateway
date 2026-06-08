import React, { useState, useEffect } from 'react';
import { ActiveScreen, Transaction } from './types';
import { INITIAL_TRANSACTIONS, StorageManager } from './mockData';
import LandingPage from './components/LandingPage';
import CheckoutPage from './components/CheckoutPage';
import ConsoleLayout from './components/ConsoleLayout';

export default function App() {
  // Global active screen state
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('landing');
  
  // Shared transactions logs
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load Transactions on App launch
  useEffect(() => {
    const savedTxns = StorageManager.get<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
    setTransactions(savedTxns);
  }, []);

  // Handle addition of successful simulated charges
  const handleAddNewTransaction = (newTxn: Transaction) => {
    const updatedTxns = [newTxn, ...transactions];
    setTransactions(updatedTxns);
    StorageManager.set('transactions', updatedTxns);
  };

  // Handle simulated refund command
  const handleRefundTransaction = (id: string) => {
    const updatedTxns = transactions.map(txn => {
      if (txn.id === id) {
        return { 
          ...txn, 
          status: 'failed' as const, // Change paid to refunded (mocked status representation)
          method: `${txn.method} (REFUNDED)`
        };
      }
      return txn;
    });
    setTransactions(updatedTxns);
    StorageManager.set('transactions', updatedTxns);
  };

  // Navigating routing selector
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Screen rendering */}
      {activeScreen === 'landing' && (
        <LandingPage onNavigate={setActiveScreen} />
      )}

      {activeScreen === 'checkout' && (
        <CheckoutPage 
          onNavigate={setActiveScreen} 
          onPaymentSuccess={handleAddNewTransaction} 
        />
      )}

      {activeScreen === 'console' && (
        <ConsoleLayout 
          onNavigate={setActiveScreen} 
          transactions={transactions} 
          onRefundTransaction={handleRefundTransaction}
        />
      )}

    </div>
  );
}
