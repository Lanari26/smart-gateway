import { apiRequest } from "./api";
import {
  Transaction,
  BillingPlan,
  SubscriptionCustomer,
  ApiKey,
  WhitelistedIp,
  Invoice,
  Project,
  GatewaySettings,
} from "../types";

// ── Auth ─────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  businessName: string | null;
  phone: string | null;
  role: "MERCHANT" | "ADMIN";
  createdAt: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: (input: {
    email: string;
    password: string;
    name: string;
    businessName?: string;
    phone?: string;
  }) => apiRequest<AuthResult>("/auth/register", { method: "POST", body: input, auth: false }),
  login: (input: { identifier: string; password: string }) =>
    apiRequest<AuthResult>("/auth/login", { method: "POST", body: input, auth: false }),
  me: () => apiRequest<{ user: AuthUser }>("/auth/me"),
  logout: (refreshToken: string) =>
    apiRequest<void>("/auth/logout", { method: "POST", body: { refreshToken }, auth: false }),
};

// ── Transactions ───────────────────────────────────────────────────────────
export const transactionsApi = {
  list: () => apiRequest<{ transactions: Transaction[] }>("/transactions").then((r) => r.transactions),
  create: (input: { customerName: string; customerEmail: string; amount: number; method?: string; status?: Transaction["status"] }) =>
    apiRequest<{ transaction: Transaction }>("/transactions", { method: "POST", body: input }).then((r) => r.transaction),
  // Public hosted checkout — no auth (a paying customer has no merchant session).
  checkout: (input: { customerName: string; customerEmail: string; amount: number; method?: string }) =>
    apiRequest<{ transaction: Transaction }>("/transactions/checkout", { method: "POST", body: input, auth: false }).then((r) => r.transaction),
  refund: (id: string) =>
    apiRequest<{ transaction: Transaction }>(`/transactions/${id}/refund`, { method: "POST" }).then((r) => r.transaction),
};

// ── Plans ────────────────────────────────────────────────────────────────
export const plansApi = {
  list: () => apiRequest<{ plans: BillingPlan[] }>("/plans").then((r) => r.plans),
  create: (input: Partial<BillingPlan> & { name: string; price: number; description: string }) =>
    apiRequest<{ plan: BillingPlan }>("/plans", { method: "POST", body: input }).then((r) => r.plan),
  remove: (id: string) => apiRequest<void>(`/plans/${id}`, { method: "DELETE" }),
};

// ── Subscriptions ──────────────────────────────────────────────────────────
export const subscriptionsApi = {
  list: () => apiRequest<{ subscriptions: SubscriptionCustomer[] }>("/subscriptions").then((r) => r.subscriptions),
  create: (input: { name: string; email: string; planName: string; amount?: number; nextBilling?: string }) =>
    apiRequest<{ subscription: SubscriptionCustomer }>("/subscriptions", { method: "POST", body: input }).then((r) => r.subscription),
  cancel: (id: string) =>
    apiRequest<{ subscription: SubscriptionCustomer }>(`/subscriptions/${id}/cancel`, { method: "POST" }).then((r) => r.subscription),
  setStatus: (id: string, status: SubscriptionCustomer["status"]) =>
    apiRequest<{ subscription: SubscriptionCustomer }>(`/subscriptions/${id}`, { method: "PATCH", body: { status } }).then((r) => r.subscription),
};

// ── API keys ─────────────────────────────────────────────────────────────
export const apiKeysApi = {
  list: () => apiRequest<{ apiKeys: ApiKey[] }>("/api-keys").then((r) => r.apiKeys),
  create: (input: { label: string; type: "PUBLIC" | "SECRET"; mode?: "live" | "test" }) =>
    apiRequest<{ apiKey: ApiKey }>("/api-keys", { method: "POST", body: input }).then((r) => r.apiKey),
  remove: (id: string) => apiRequest<void>(`/api-keys/${id}`, { method: "DELETE" }),
};

// ── Whitelisted IPs ──────────────────────────────────────────────────────
export const whitelistApi = {
  list: () => apiRequest<{ ips: WhitelistedIp[] }>("/whitelist").then((r) => r.ips),
  create: (input: { ip: string; label: string }) =>
    apiRequest<{ ip: WhitelistedIp }>("/whitelist", { method: "POST", body: input }).then((r) => r.ip),
  remove: (id: string) => apiRequest<void>(`/whitelist/${id}`, { method: "DELETE" }),
};

// ── Invoices ─────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: () => apiRequest<{ invoices: Invoice[] }>("/invoices").then((r) => r.invoices),
  create: (input: { clientName: string; clientEmail: string; amount: number; issueDate?: string; status?: Invoice["status"] }) =>
    apiRequest<{ invoice: Invoice }>("/invoices", { method: "POST", body: input }).then((r) => r.invoice),
  pay: (id: string) =>
    apiRequest<{ invoice: Invoice }>(`/invoices/${id}/pay`, { method: "POST" }).then((r) => r.invoice),
  setStatus: (id: string, status: Invoice["status"]) =>
    apiRequest<{ invoice: Invoice }>(`/invoices/${id}`, { method: "PATCH", body: { status } }).then((r) => r.invoice),
  remove: (id: string) => apiRequest<void>(`/invoices/${id}`, { method: "DELETE" }),
};

// ── Projects ───────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => apiRequest<{ projects: Project[] }>("/projects").then((r) => r.projects),
  create: (input: { name: string; webhookUrl?: string }) =>
    apiRequest<{ project: Project }>("/projects", { method: "POST", body: input }).then((r) => r.project),
  remove: (id: string) => apiRequest<void>(`/projects/${id}`, { method: "DELETE" }),
};

// ── Settings (admin) ─────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => apiRequest<{ settings: GatewaySettings }>("/settings").then((r) => r.settings),
  update: (patch: Partial<GatewaySettings>) =>
    apiRequest<{ settings: GatewaySettings }>("/settings", { method: "PATCH", body: patch }).then((r) => r.settings),
};

// ── Dashboard ──────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalVolume: number;
  currency: string;
  transactions: { total: number; paid: number; pending: number; failed: number; successRate: number };
  subscriptions: { active: number; mrr: number };
  invoices: { outstanding: number; outstandingAmount: number };
}

export const dashboardApi = {
  stats: () => apiRequest<{ stats: DashboardStats }>("/dashboard").then((r) => r.stats),
};
