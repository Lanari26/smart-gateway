import type { Request, Response, NextFunction } from 'express';
import type { ApiKeyType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/http-error.js';

// Augment Express Request with the resolved API key principal.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiKey?: { id: string; merchantId: string | null; type: ApiKeyType };
    }
  }
}

/**
 * Reads the caller's API key from `X-API-Key` (preferred) or an
 * `Authorization: Bearer sk_…/pk_…` header, validates it, and attaches the
 * owning merchant to `req.apiKey`. Server integrations send their SECRET key;
 * the hosted checkout sends a PUBLIC (publishable) key. Missing/unknown keys
 * are rejected so every charge is attributable.
 */
export async function authenticateApiKey(req: Request, _res: Response, next: NextFunction) {
  // Async middleware: Express 4 doesn't catch rejected promises, so forward
  // errors explicitly via next(err) rather than throwing.
  try {
    const token = extractKey(req);
    if (!token) throw HttpError.unauthorized('Missing API key. Send it as the X-API-Key header.');

    const key = await prisma.apiKey.findUnique({ where: { token } });
    if (!key) throw HttpError.unauthorized('Invalid API key.');

    req.apiKey = { id: key.id, merchantId: key.merchantId, type: key.type };
    next();
  } catch (err) {
    next(err);
  }
}

function extractKey(req: Request): string | null {
  const headerKey = req.header('x-api-key');
  if (headerKey?.trim()) return headerKey.trim();

  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (token.startsWith('sk_') || token.startsWith('pk_')) return token;
  }
  return null;
}
