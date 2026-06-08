import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateBody } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas.js';
import * as controller from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
authRouter.post('/refresh', validateBody(refreshSchema), asyncHandler(controller.refresh));
authRouter.post('/logout', asyncHandler(controller.logout));
authRouter.get('/me', authenticate, asyncHandler(controller.me));
