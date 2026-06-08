import { InvoiceStatus, SubscriptionStatus, TransactionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

/** Aggregated metrics for the console dashboard. */
export async function getDashboardStats() {
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
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: TransactionStatus.PAID } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: TransactionStatus.PAID } }),
    prisma.transaction.count({ where: { status: TransactionStatus.PENDING } }),
    prisma.transaction.count({ where: { status: TransactionStatus.FAILED } }),
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
    currency: 'USD',
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
