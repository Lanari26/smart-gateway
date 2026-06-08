import { z } from 'zod';

export const createTransactionSchema = z.object({
  customerName: z.string().min(1).max(160),
  customerEmail: z.string().email(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.string().min(1).max(80).default('Card'),
  status: z.enum(['paid', 'pending', 'failed']).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
