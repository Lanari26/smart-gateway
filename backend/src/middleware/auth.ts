import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { HttpError } from '../lib/http-error.js';
import { verifyAccessToken, type AccessTokenPayload } from '../modules/auth/tokens.js';

// Augment Express Request with the authenticated principal.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/** Requires a valid Bearer access token; attaches `req.user`. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw HttpError.unauthorized('Missing bearer token');
  }
  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    throw HttpError.unauthorized('Invalid or expired token');
  }
}

/** Restricts a route to specific roles. Use after `authenticate`. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw HttpError.unauthorized();
    if (!roles.includes(req.user.role)) throw HttpError.forbidden('Insufficient role');
    next();
  };
}
