import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createTransactionSchema } from './transactions.schemas.js';
import * as service from './transactions.service.js';

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);

transactionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ transactions: await service.listTransactions() });
  }),
);

transactionsRouter.post(
  '/',
  validateBody(createTransactionSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ transaction: await service.createTransaction(req.body) });
  }),
);

transactionsRouter.post(
  '/:id/refund',
  asyncHandler(async (req, res) => {
    res.json({ transaction: await service.refundTransaction(req.params.id) });
  }),
);
