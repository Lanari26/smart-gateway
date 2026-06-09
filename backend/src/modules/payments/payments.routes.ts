import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody } from '../../middleware/validate.js';
import { authenticateApiKey } from '../../middleware/api-key.js';
import { cardChargeSchema, momoChargeSchema } from './payments.schemas.js';
import * as service from './payments.service.js';

// Hosted-checkout endpoints. Charge creation is authenticated by an API key
// (SECRET for server integrations, PUBLIC/publishable for the hosted checkout)
// so every transaction is attributed to its merchant. Status polling stays
// public — the paying customer has no key, only the opaque reference.
export const paymentsRouter = Router();

// Initiate a Mobile Money charge. Returns a PENDING transaction; the gateway
// prompts the payer on their handset to approve.
paymentsRouter.post(
  '/momo',
  authenticateApiKey,
  validateBody(momoChargeSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createMomoCharge(req.body, req.apiKey!.merchantId));
  }),
);

// Poll a charge's status. Performs a live verify against the gateway and
// returns the up-to-date transaction (status: pending | paid | failed).
paymentsRouter.get(
  '/:reference/status',
  asyncHandler(async (req, res) => {
    res.json({ transaction: await service.getChargeStatus(req.params.reference) });
  }),
);

// Generate a hosted card-payment link.
paymentsRouter.post(
  '/card',
  authenticateApiKey,
  validateBody(cardChargeSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await service.createCardCharge(req.body, req.apiKey!.merchantId));
  }),
);
