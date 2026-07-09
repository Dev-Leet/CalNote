import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Generic Zod validation middleware factory. Validates the specified request
 * part against the given schema and replaces it with the parsed (and
 * type-coerced/defaulted) result, so downstream handlers get a typed,
 * trustworthy payload.
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      req[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          new AppError('VALIDATION_ERROR', 400, 'Request validation failed', {
            issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          }),
        );
      }
      next(err);
    }
  };
}
