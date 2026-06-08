import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createPlanSchema } from './plans.schemas.js';
import * as service from './plans.service.js';

export const plansRouter = Router();

plansRouter.use(authenticate);

plansRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ plans: await service.listPlans() });
  }),
);

plansRouter.post(
  '/',
  validateBody(createPlanSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ plan: await service.createPlan(req.body) });
  }),
);

plansRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await service.deletePlan(req.params.id);
    res.status(204).end();
  }),
);
