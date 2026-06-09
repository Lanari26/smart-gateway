import { InvoiceStatus, Role, SubscriptionStatus, TransactionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

interface Principal {
  sub: string;
  role: Role;
}

/** Aggregated metrics for the console dashboard, scoped to the merchant. */
export async function getDashboardStats(principal: Principal) {
  // Transaction metrics are per-merchant (admin sees all). Subscriptions and
  // invoices aren't owner-attributed, so they stay global.
  const txScope = principal.role === Role.ADMIN ? {} : { merchantId: principal.sub };

  const [
    paidAgg,
    totalCount,
    paidCount,
    pendingCount,
    failedCount,
    activeSubs,
    mrrAgg,
    pendingInvoices,
    outstandingAgg,
  ] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { ...txScope, status: TransactionStatus.PAID } }),
    prisma.transaction.count({ where: txScope }),
    prisma.transaction.count({ where: { ...txScope, status: TransactionStatus.PAID } }),
    prisma.transaction.count({ where: { ...txScope, status: TransactionStatus.PENDING } }),
    prisma.transaction.count({ where: { ...txScope, status: TransactionStatus.FAILED } }),
    prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    prisma.subscription.aggregate({ _sum: { amount: true }, where: { status: SubscriptionStatus.ACTIVE } }),
    prisma.invoice.count({ where: { status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] } } }),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] } },
    }),
  ]);

  const totalVolume = paidAgg._sum.amount ?? 0;
  const successRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 1000) / 10 : 0;

  return {
    totalVolume,
    currency: 'RWF',
    transactions: {
      total: totalCount,
      paid: paidCount,
      pending: pendingCount,
      failed: failedCount,
      successRate, // percentage, one decimal
    },
    subscriptions: {
      active: activeSubs,
      mrr: mrrAgg._sum.amount ?? 0, // monthly recurring revenue (active plans)
    },
    invoices: {
      outstanding: pendingInvoices,
      outstandingAmount: outstandingAgg._sum.amount ?? 0,
    },
  };
}
