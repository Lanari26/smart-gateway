import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscriptions.schemas.js';
import * as service from './subscriptions.service.js';

export const subscriptionsRouter = Router();

subscriptionsRouter.use(authenticate);

subscriptionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ subscriptions: await service.listSubscriptions() });
  }),
);

subscriptionsRouter.post(
  '/',
  validateBody(createSubscriptionSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ subscription: await service.createSubscription(req.body) });
  }),
);

subscriptionsRouter.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    res.json({ subscription: await service.cancelSubscription(req.params.id) });
  }),
);

subscriptionsRouter.patch(
  '/:id',
  validateBody(updateSubscriptionSchema),
  asyncHandler(async (req, res) => {
    res.json({ subscription: await service.setSubscriptionStatus(req.params.id, req.body.status) });
  }),
);
