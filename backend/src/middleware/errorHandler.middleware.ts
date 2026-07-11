import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Central error-normalization middleware, per HLD Section 2.4. Must be
 * registered LAST in app.ts, after all routes and the 404 handler.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(
      { code: err.code, statusCode: err.statusCode, path: req.path, userId: req.user?.userId },
      err.message,
    );
    res.status(err.statusCode).json({ code: err.code, message: err.message, details: err.details });
    return;
  }

  logger.error({ err, path: req.path, userId: req.user?.userId }, 'Unhandled error');
  res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` });
}
