export type ActiveScreen = 'landing' | 'checkout' | 'console' | 'auth';

export type ConsoleTab =
  | 'dashboard'
  | 'projects'
  | 'billing'
  | 'developers'
  | 'invoices'
  | 'admin';

export interface Transaction {
  id: string;
  reference?: string;
  customerName: string;
  customerEmail: string;
  avatarLetter: string;
  imageUrl?: string;
  status: 'paid' | 'pending' | 'failed';
  amount: number;
  method: string;
  provider?: string | null;
  date: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  cycle: 'Monthly' | 'Yearly' | 'Quarterly';
  subscribers: number;
  description: string;
  isPopular?: boolean;
  isScalable?: boolean;
}

export interface SubscriptionCustomer {
  id: string;
  name: string;
  email: string;
  planName: string;
  status: 'Active' | 'Pending' | 'Cancelled';
  nextBilling: string;
  amount: number;
  avatarColor: string;
}

export interface ApiKey {
  id: string;
  label: string;
  type: 'PUBLIC' | 'SECRET';
  token: string;
  created: string;
}

export interface WhitelistedIp {
  id: string;
  ip: string;
  label: string;
}

export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  avatarLetter: string;
  amount: number;
  issueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Project {
  id: string;
  name: string;
  webhookUrl: string;
  keysCreated: number;
  totalCalls: number;
  status: 'active' | 'configuring';
}

export interface GatewaySettings {
  feeMarkup: number;
  routingPreference: string;
  simulationSpeed: number;
}
