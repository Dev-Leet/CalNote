import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { postAiSchedule, getAiScheduleStatus } from './ai.controller';

const router = Router();

const aiScheduleBodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  provider: z.enum(['ashna', 'custom']).optional(),
  dateRangeHint: z
    .object({
      from: z.string().datetime({ offset: true }).or(z.string().date()),
      to: z.string().datetime({ offset: true }).or(z.string().date()),
    })
    .optional(),
});

router.post('/schedule', requireAuth, validate(aiScheduleBodySchema, 'body'), postAiSchedule);
router.get('/schedule/status/:jobId', requireAuth, getAiScheduleStatus);

export default router;
