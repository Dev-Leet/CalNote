import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { listRuntimes, runCode } from './codeExecution.controller';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(requireAuth);

/**
 * Dedicated limiter, separate from aiScheduleRateLimiter — code execution
 * hits a third-party service with its own fair-use expectations, and abuse
 * here (e.g. someone scripting rapid repeated runs) has a different cost
 * profile than AI scheduling calls, so it deserves its own budget rather
 * than sharing one.
 */
const codeExecutionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({ code: 'RATE_LIMITED', message: 'Too many code executions — please slow down.' });
  },
});

router.get('/runtimes', listRuntimes);

const runCodeSchema = z.object({
  language: z.string().min(1).max(50),
  code: z.string().min(1).max(50_000),
  stdin: z.string().max(10_000).optional(),
});

router.post('/run', codeExecutionRateLimiter, validate(runCodeSchema, 'body'), runCode);

export default router;