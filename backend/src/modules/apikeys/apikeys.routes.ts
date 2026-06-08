import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createApiKeySchema } from './apikeys.schemas.js';
import * as service from './apikeys.service.js';

export const apiKeysRouter = Router();

apiKeysRouter.use(authenticate);

apiKeysRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ apiKeys: await service.listApiKeys() });
  }),
);

apiKeysRouter.post(
  '/',
  validateBody(createApiKeySchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ apiKey: await service.createApiKey(req.body, req.user?.sub) });
  }),
);

apiKeysRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await service.deleteApiKey(req.params.id);
    res.status(204).end();
  }),
);
