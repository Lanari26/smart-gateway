import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1).max(160),
  price: z.coerce.number().nonnegative(),
  cycle: z.enum(['Monthly', 'Quarterly', 'Yearly']).default('Monthly'),
  description: z.string().min(1).max(500),
  subscribers: z.coerce.number().int().nonnegative().optional(),
  isPopular: z.boolean().optional(),
  isScalable: z.boolean().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
