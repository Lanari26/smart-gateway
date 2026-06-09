import { randomBytes } from 'node:crypto';
import { Role, TransactionStatus, type Transaction } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/http-error.js';
import { avatarLetter, formatDateTime } from '../../lib/format.js';
import type { CreateTransactionInput } from './transactions.schemas.js';

/** The authenticated console principal (subset of the access-token payload). */
export interface Principal {
  sub: string; // merchant id
  role: Role;
}

/** A MERCHANT only ever sees/touches its own rows; an ADMIN sees everything. */
function scopeFor(principal: Principal) {
  return principal.role === Role.ADMIN ? {} : { merchantId: principal.sub };
}

const STATUS_TO_DTO: Record<TransactionStatus, 'paid' | 'pending' | 'failed'> = {
  PAID: 'paid',
  PENDING: 'pending',
  FAILED: 'failed',
};

const STATUS_FROM_DTO: Record<'paid' | 'pending' | 'failed', TransactionStatus> = {
  paid: TransactionStatus.PAID,
  pending: TransactionStatus.PENDING,
  failed: TransactionStatus.FAILED,
};

function toDTO(t: Transaction) {
  return {
    id: t.id,
    reference: t.reference,
    customerName: t.customerName,
    customerEmail: t.customerEmail,
    avatarLetter: avatarLetter(t.customerName),
    amount: t.amount,
    currency: t.currency,
    method: t.method,
    status: STATUS_TO_DTO[t.status],
    date: formatDateTime(t.createdAt),
    createdAt: t.createdAt,
  };
}

function generateReference(): string {
  return `tx_${randomBytes(4).toString('hex')}`;
}

export async function listTransactions(principal: Principal) {
  const rows = await prisma.transaction.findMany({
    where: scopeFor(principal),
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toDTO);
}

export async function createTransaction(input: CreateTransactionInput, principal: Principal) {
  const tx = await prisma.transaction.create({
    data: {
      reference: generateReference(),
      merchantId: principal.sub,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      amount: input.amount,
      method: input.method,
      status: input.status ? STATUS_FROM_DTO[input.status] : TransactionStatus.PAID,
    },
  });
  return toDTO(tx);
}

export async function refundTransaction(id: string, principal: Principal) {
  const current = await prisma.transaction.findUnique({ where: { id } });
  if (!current) throw HttpError.notFound('Transaction not found');
  // A merchant may only refund its own charges; an admin may refund any.
  if (principal.role !== Role.ADMIN && current.merchantId !== principal.sub) {
    throw HttpError.notFound('Transaction not found');
  }
  if (current.status === TransactionStatus.FAILED) {
    return toDTO(current); // already refunded/failed — idempotent.
  }
  const method = current.method.includes('(REFUNDED)')
    ? current.method
    : `${current.method} (REFUNDED)`;
  const tx = await prisma.transaction.update({
    where: { id },
    data: { status: TransactionStatus.FAILED, method },
  });
  return toDTO(tx);
}
