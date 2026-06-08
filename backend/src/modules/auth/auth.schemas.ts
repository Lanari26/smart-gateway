import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Please enter your name').max(120),
  businessName: z.string().max(160).optional(),
  // Accepts international formats: digits, spaces, +, -, parentheses.
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s\-()]{6,19}$/, 'Please enter a valid phone number')
    .optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1), // email or phone
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
