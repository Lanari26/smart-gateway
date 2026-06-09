import { Transaction, BillingPlan, SubscriptionCustomer, ApiKey, WhitelistedIp, Invoice } from './types';

// Seed Transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_8f9e1a",
    customerName: "Sarah Connor",
    customerEmail: "sarah.c@cyberdyne.org",
    avatarLetter: "S",
    status: "paid",
    amount: 193700,
    method: "Visa •••• 4242",
    date: "Jun 08, 2026, 03:24 PM"
  },
  {
    id: "tx_3c4d5e",
    customerName: "Bruce Wayne",
    customerEmail: "bruce@waynecorp.com",
    avatarLetter: "B",
    status: "paid",
    amount: 3248700,
    method: "Mastercard •••• 9111",
    date: "Jun 07, 2026, 11:12 AM"
  },
  {
    id: "tx_2b3a5c",
    customerName: "Peter Parker",
    customerEmail: "spidey@dailybugle.net",
    avatarLetter: "P",
    status: "failed",
    amount: 19500,
    method: "Amex •••• 1007",
    date: "Jun 06, 2026, 09:05 AM"
  },
  {
    id: "tx_9d0e1f",
    customerName: "Tony Stark",
    customerEmail: "tony@starkindustries.com",
    avatarLetter: "T",
    status: "paid",
    amount: 16250000,
    method: "Apple Pay",
    date: "Jun 05, 2026, 06:45 PM"
  },
  {
    id: "tx_4r5t6y",
    customerName: "Clark Kent",
    customerEmail: "clark@dailyplanet.com",
    avatarLetter: "C",
    status: "pending",
    amount: 63700,
    method: "Google Pay",
    date: "Jun 05, 2026, 01:10 PM"
  },
  {
    id: "tx_7u8i9o",
    customerName: "Selina Kyle",
    customerEmail: "selina@gothamcats.org",
    avatarLetter: "S",
    status: "paid",
    amount: 234000,
    method: "Visa •••• 1312",
    date: "Jun 04, 2026, 10:30 PM"
  }
];

// Seed Billing Plans
export const INITIAL_BILLING_PLANS: BillingPlan[] = [
  {
    id: "plan_starter",
    name: "Developer Starter",
    price: 24700,
    cycle: "Monthly",
    subscribers: 142,
    description: "Ideal for sandbox prototypes, early stage startups, and small hobby integrations.",
    isPopular: false
  },
  {
    id: "plan_growth",
    name: "Growth Scale Pro",
    price: 115700,
    cycle: "Monthly",
    subscribers: 589,
    description: "Our flagship subscription including priority visual dashboard, RWF settlement processing, and instant webhooks.",
    isPopular: true,
    isScalable: true
  },
  {
    id: "plan_enterprise",
    name: "Enterprise Dedicated Integration",
    price: 518700,
    cycle: "Monthly",
    subscribers: 48,
    description: "Bespoke isolated processing clusters, dedicated account managers, zero interchange markup, and direct bank settlement.",
    isPopular: false,
    isScalable: true
  }
];

// Seed Customer Subscriptions
export const INITIAL_CUSTOMERS: SubscriptionCustomer[] = [
  {
    id: "sub_1",
    name: "Alex Rivera",
    email: "alex@riveratech.io",
    planName: "Growth Scale Pro",
    status: "Active",
    nextBilling: "Jul 08, 2026",
    amount: 115700,
    avatarColor: "bg-emerald-500/20 text-emerald-400"
  },
  {
    id: "sub_2",
    name: "Clara Oswald",
    email: "clara@spaceandtime.org",
    planName: "Developer Starter",
    status: "Active",
    nextBilling: "Jul 01, 2026",
    amount: 24700,
    avatarColor: "bg-blue-500/20 text-blue-400"
  },
  {
    id: "sub_3",
    name: "Miles Morales",
    email: "miles@brooklynsound.com",
    planName: "Growth Scale Pro",
    status: "Active",
    nextBilling: "Jul 09, 2026",
    amount: 115700,
    avatarColor: "bg-pink-500/20 text-pink-400"
  },
  {
    id: "sub_4",
    name: "Diana Prince",
    email: "diana@themyscira.gov",
    planName: "Enterprise Dedicated Integration",
    status: "Active",
    nextBilling: "Jul 15, 2026",
    amount: 518700,
    avatarColor: "bg-purple-500/20 text-purple-400"
  },
  {
    id: "sub_5",
    name: "Wade Wilson",
    email: "wade@deadpoolrentals.com",
    planName: "Developer Starter",
    status: "Cancelled",
    nextBilling: "N/A",
    amount: 0,
    avatarColor: "bg-rose-500/20 text-rose-400"
  }
];

// Seed API Keys
export const INITIAL_API_KEYS: ApiKey[] = [
  {
    id: "key_1",
    label: "Production Public SDK API Key",
    type: "PUBLIC",
    token: "pk_live_demo_publishable_key_replace_me",
    created: "May 12, 2026"
  },
  {
    id: "key_2",
    label: "Production Secret Backend Key (Hidden)",
    type: "SECRET",
    token: "sk_live_demo_secret_key_replace_me",
    created: "May 12, 2026"
  },
  {
    id: "key_3",
    label: "Development Sandbox Public Token",
    type: "PUBLIC",
    token: "pk_test_demo_sandbox_key_replace_me",
    created: "Jun 01, 2026"
  }
];

// Seed Whitelisted IPs
export const INITIAL_IPS: WhitelistedIp[] = [
  {
    id: "ip_1",
    ip: "192.168.1.105",
    label: "Staging Cluster Server Node (Oregon)"
  },
  {
    id: "ip_2",
    ip: "44.204.12.89",
    label: "AWS Backend Application Cluster"
  },
  {
    id: "ip_3",
    ip: "8.8.8.8",
    label: "External Developer DNS Test"
  }
];

// Seed Invoices
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "INV-2026-004",
    clientName: "Cyberdyne Systems",
    clientEmail: "accounts@cyberdyne.org",
    avatarLetter: "C",
    amount: 1625000,
    issueDate: "Jun 08, 2026",
    status: "Pending"
  },
  {
    id: "INV-2026-003",
    clientName: "Wayne Enterprises",
    clientEmail: "billing@waynecorp.com",
    avatarLetter: "W",
    amount: 12740000,
    issueDate: "Jun 02, 2026",
    status: "Paid"
  },
  {
    id: "INV-2026-002",
    clientName: "Daily Planet Co",
    clientEmail: "finance@dailyplanet.com",
    avatarLetter: "D",
    amount: 585000,
    issueDate: "May 28, 2026",
    status: "Overdue"
  },
  {
    id: "INV-2026-001",
    clientName: "Oscorp Biotech",
    clientEmail: "payments@oscorp.io",
    avatarLetter: "O",
    amount: 4160000,
    issueDate: "May 15, 2026",
    status: "Paid"
  }
];

// Helper to interact with LocalStorage
export const StorageManager = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(`smartpay_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(`smartpay_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }
};
