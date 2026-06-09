import { z } from 'zod';

export const updateSettingsSchema = z.object({
  feeMarkup: z.coerce.number().min(0).max(20).optional(),
  routingPreference: z.enum(['lowest-cost', 'latency-aware', 'high-converting']).optional(),
  simulationSpeed: z.coerce.number().int().min(0).max(10000).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
