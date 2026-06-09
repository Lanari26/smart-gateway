import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { transactionsRouter } from './modules/transactions/transactions.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { plansRouter } from './modules/plans/plans.routes.js';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes.js';
import { apiKeysRouter } from './modules/apikeys/apikeys.routes.js';
import { whitelistRouter } from './modules/whitelist/whitelist.routes.js';
import { invoicesRouter } from './modules/invoices/invoices.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';

/** Aggregates every feature router under /api. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/transactions', transactionsRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/plans', plansRouter);
apiRouter.use('/subscriptions', subscriptionsRouter);
apiRouter.use('/api-keys', apiKeysRouter);
apiRouter.use('/whitelist', whitelistRouter);
apiRouter.use('/invoices', invoicesRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/settings', settingsRouter);
