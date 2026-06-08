import { z } from 'zod';

export const createIpSchema = z.object({
  // Accepts IPv4/IPv6; keep it permissive but bounded.
  ip: z.string().min(3).max(45).regex(/^[0-9a-fA-F:.]+$/, 'Please enter a valid IP address'),
  label: z.string().min(1).max(160),
});

export type CreateIpInput = z.infer<typeof createIpSchema>;
