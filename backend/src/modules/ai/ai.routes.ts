import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { aiScheduleRateLimiter } from '../../middleware/rateLimit.middleware';
import { aiScheduleBodySchema } from './ai.validation';
import { postAiSchedule, getAiScheduleStatus } from './ai.controller';
import { askNotesAi } from './notesAi.controller';

const router = Router();

router.post('/schedule', requireAuth, aiScheduleRateLimiter, validate(aiScheduleBodySchema, 'body'), postAiSchedule);
router.get('/schedule/status/:jobId', requireAuth, getAiScheduleStatus);

const notesAiAskSchema = z.object({
  selectedText: z.string().min(1).max(4000),
  instruction: z.enum(['explain', 'review_errors', 'optimise', 'custom']),
  customQuestion: z.string().min(1).max(500).optional(),
  noteContext: z.string().max(8000).optional(),
});

router.post('/notes/ask', requireAuth, aiScheduleRateLimiter, validate(notesAiAskSchema, 'body'), askNotesAi);

export default router;