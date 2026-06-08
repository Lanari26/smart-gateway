import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import * as service from './dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ stats: await service.getDashboardStats() });
  }),
);
