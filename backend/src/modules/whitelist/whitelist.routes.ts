import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createIpSchema } from './whitelist.schemas.js';
import * as service from './whitelist.service.js';

export const whitelistRouter = Router();

whitelistRouter.use(authenticate);

whitelistRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ ips: await service.listIps() });
  }),
);

whitelistRouter.post(
  '/',
  validateBody(createIpSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ ip: await service.createIp(req.body) });
  }),
);

whitelistRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await service.deleteIp(req.params.id);
    res.status(204).end();
  }),
);
