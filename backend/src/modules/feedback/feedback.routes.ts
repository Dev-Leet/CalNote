import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { aiScheduleRateLimiter } from '../../middleware/rateLimit.middleware';
import { submitFeedback } from './feedback.controller';

const router = Router();
router.use(requireAuth);

const submitFeedbackSchema = z.object({
  category: z.enum(['bug', 'feature-request', 'general', 'praise']),
  message: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  pageContext: z.string().max(100).optional(),
});

// Reusing the existing per-user rate limiter (10/min) rather than defining
// a new one — feedback submission has a similar "prevent accidental spam"
// risk profile to the other endpoints already using it, and doesn't
// warrant its own bespoke limiter for what should be an infrequent action.
router.post('/', aiScheduleRateLimiter, validate(submitFeedbackSchema), submitFeedback);

export default router;