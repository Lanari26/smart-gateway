import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(160),
  email: z.string().email(),
  planName: z.string().min(1).max(160),
  amount: z.coerce.number().nonnegative().default(0),
  nextBilling: z.string().max(40).optional(),
  status: z.enum(['Active', 'Pending', 'Cancelled']).optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
