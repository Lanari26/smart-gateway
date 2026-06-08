import { z } from 'zod';

export const createInvoiceSchema = z.object({
  clientName: z.string().min(1).max(160),
  clientEmail: z.string().email(),
  amount: z.coerce.number().positive(),
  issueDate: z.string().max(40).optional(),
  status: z.enum(['Paid', 'Pending', 'Overdue']).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
