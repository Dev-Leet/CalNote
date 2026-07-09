import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';
import { AppError } from '../utils/AppError';

export interface AuthenticatedUser {
  userId: string;
  role: 'user' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Verifies the JWT access token from the Authorization header and attaches
 * the authenticated user (userId + role) to req.user for downstream handlers.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 401, 'Missing or malformed Authorization header'));
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = authService.verifyAccessToken(token);
    req.user = { userId: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-gate middleware — use after requireAuth. e.g. requireRole('admin')
 */
export function requireRole(role: 'user' | 'admin') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 401, 'Not authenticated'));
    }
    if (req.user.role !== role && req.user.role !== 'admin') {
      return next(new AppError('NOT_OWNER', 403, 'Insufficient permissions'));
    }
    next();
  };
}
