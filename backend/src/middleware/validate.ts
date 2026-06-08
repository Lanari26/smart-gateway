import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Validates and replaces a request part with the parsed (typed, coerced) value.
 * Usage: router.post('/', validateBody(schema), handler)
 */
export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };

export const validateQuery =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    // req.query is a getter in Express 5; mutate in place to stay compatible.
    Object.assign(req.query, schema.parse(req.query));
    next();
  };
