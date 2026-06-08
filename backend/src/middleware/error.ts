import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/http-error.js';
import { isProd } from '../env.js';

/** 404 for unmatched routes. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

/** Central error formatter. Keep this last in the middleware chain. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.flatten(),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unique-constraint and other known Prisma errors → 409 / 404.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Resource already exists' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Resource not found' });
    }
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[error]', err);
  return res.status(500).json({
    error: 'Internal server error',
    ...(isProd ? {} : { message }),
  });
}
