import { z } from 'zod';

// A Rwandan MSISDN in any common shape: 0788..., 250788..., +250788...
// MTN (078/079) and Airtel (072/073), with optional 0 / +250 / 250 prefix.
const phone = z
  .string()
  .trim()
  .regex(/^(?:\+?250|0)?7[2389]\d{7}$/, 'Enter a valid Rwandan mobile number');

// Split-payout recipient: a wallet number and the percentage of the net
// (post-fee) amount it should receive once the charge settles.
const recipientSchema = z.object({
  phone,
  percent: z.coerce.number().positive('percent must be > 0').max(100, 'percent cannot exceed 100'),
});

export const momoChargeSchema = z
  .object({
    customerName: z.string().trim().min(1).max(160),
    customerEmail: z.string().email(),
    phone,
    amount: z.coerce.number().int('Amount must be a whole number of RWF').positive('Amount must be greater than 0'),
    provider: z.enum(['MTN', 'AIRTEL']).optional(),
    note: z.string().max(120).optional(),
    message: z.string().max(160).optional(),
    // Optional auto-disbursement after the charge succeeds.
    recipients: z.array(recipientSchema).max(10).optional(),
  })
  .refine(
    (v) => !v.recipients || v.recipients.reduce((s, r) => s + r.percent, 0) <= 100,
    { message: 'recipient percentages cannot sum to more than 100', path: ['recipients'] },
  );

export const cardChargeSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  email: z.string().email(),
  amount: z.coerce.number().int().positive(),
});

export type MomoChargeInput = z.infer<typeof momoChargeSchema>;
export type CardChargeInput = z.infer<typeof cardChargeSchema>;
