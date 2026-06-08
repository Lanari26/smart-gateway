import { z } from 'zod';

export const createApiKeySchema = z.object({
  label: z.string().min(1).max(160),
  type: z.enum(['PUBLIC', 'SECRET']).default('PUBLIC'),
  // Live vs test key prefix.
  mode: z.enum(['live', 'test']).default('live'),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
