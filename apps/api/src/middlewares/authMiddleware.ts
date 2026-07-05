// apps/api/src/middlewares/authMiddleware.ts
// JWT authentication middleware

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string,
  });
}

/**
 * Verify a JWT token and return the payload
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * requireAuth middleware — protects routes by validating JWT
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization header missing or invalid',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.warn('Auth middleware: invalid token', { error });
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

/**
 * optionalAuth — attaches user if token present, but doesn't block
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      req.user = verifyToken(token);
    }
  } catch {
    // Ignore invalid tokens in optional auth
  }
  next();
}
