import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { updateSettingsSchema } from './settings.schemas.js';
import * as service from './settings.service.js';

export const settingsRouter = Router();

settingsRouter.use(authenticate);

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ settings: await service.getSettings() });
  }),
);

settingsRouter.patch(
  '/',
  validateBody(updateSettingsSchema),
  asyncHandler(async (req, res) => {
    res.json({ settings: await service.updateSettings(req.body) });
  }),
);
