import { InvoiceStatus, type Invoice } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/http-error.js';
import { avatarLetter, formatDate } from '../../lib/format.js';
import type { CreateInvoiceInput } from './invoices.schemas.js';

const STATUS_TO_DTO: Record<InvoiceStatus, 'Paid' | 'Pending' | 'Overdue'> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  OVERDUE: 'Overdue',
};

const STATUS_FROM_DTO: Record<'Paid' | 'Pending' | 'Overdue', InvoiceStatus> = {
  Paid: InvoiceStatus.PAID,
  Pending: InvoiceStatus.PENDING,
  Overdue: InvoiceStatus.OVERDUE,
};

function toDTO(inv: Invoice) {
  return {
    id: inv.number,
    invoiceId: inv.id,
    clientName: inv.clientName,
    clientEmail: inv.clientEmail,
    avatarLetter: avatarLetter(inv.clientName),
    amount: inv.amount,
    issueDate: inv.issueDate,
    status: STATUS_TO_DTO[inv.status],
  };
}

/** Allocates the next INV-YYYY-NNN number for the current year. */
async function generateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const count = await prisma.invoice.count({ where: { number: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}

export async function listInvoices() {
  const rows = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(toDTO);
}

export async function createInvoice(input: CreateInvoiceInput) {
  const invoice = await prisma.invoice.create({
    data: {
      number: await generateNumber(),
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      amount: input.amount,
      issueDate: input.issueDate ?? formatDate(new Date()),
      status: input.status ? STATUS_FROM_DTO[input.status] : InvoiceStatus.PENDING,
    },
  });
  return toDTO(invoice);
}

export async function markInvoicePaid(id: string) {
  const current = await prisma.invoice.findUnique({ where: { id } });
  if (!current) throw HttpError.notFound('Invoice not found');
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: InvoiceStatus.PAID },
  });
  return toDTO(invoice);
}

// The frontend identifies invoices by their human number (INV-YYYY-NNN).
export async function setInvoiceStatus(number: string, status: 'Paid' | 'Pending' | 'Overdue') {
  const current = await prisma.invoice.findUnique({ where: { number } });
  if (!current) throw HttpError.notFound('Invoice not found');
  const invoice = await prisma.invoice.update({
    where: { number },
    data: { status: STATUS_FROM_DTO[status] },
  });
  return toDTO(invoice);
}

export async function deleteInvoice(number: string) {
  await prisma.invoice.delete({ where: { number } });
}
