import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createInvoiceSchema } from './invoices.schemas.js';
import * as service from './invoices.service.js';

export const invoicesRouter = Router();

invoicesRouter.use(authenticate);

invoicesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ invoices: await service.listInvoices() });
  }),
);

invoicesRouter.post(
  '/',
  validateBody(createInvoiceSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ invoice: await service.createInvoice(req.body) });
  }),
);

invoicesRouter.post(
  '/:id/pay',
  asyncHandler(async (req, res) => {
    res.json({ invoice: await service.markInvoicePaid(req.params.id) });
  }),
);
