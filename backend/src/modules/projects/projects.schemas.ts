import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(160),
  webhookUrl: z.string().max(400).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
