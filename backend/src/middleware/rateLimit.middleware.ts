import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
 
/**
 * Per HLD Section 1.5: rate limiting applied specifically to auth and AI
 * scheduling endpoints, since these are the most expensive (cost/compute
 * and brute-force-risk) operations in the system. Not yet wired into
 * auth.routes.ts / ai.routes.ts — apply as router-level middleware, e.g.
 * `router.post('/login', authRateLimiter, validate(...), login)`.
 */

function rateLimitedResponse(_req: Request, res: Response): void {
  res.status(429).json({ code: 'RATE_LIMITED', message: 'Too many requests — please try again shortly.' });
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});

export const aiScheduleRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.userId ?? req.ip ?? 'anonymous',
  handler: rateLimitedResponse,
});

export const globalApiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});
