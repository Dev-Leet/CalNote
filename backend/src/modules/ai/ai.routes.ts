import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { aiScheduleRateLimiter } from '../../middleware/rateLimit.middleware';
import { aiScheduleBodySchema } from './ai.validation';
import { postAiSchedule, getAiScheduleStatus } from './ai.controller';

const router = Router();

router.post('/schedule', requireAuth, aiScheduleRateLimiter, validate(aiScheduleBodySchema, 'body'), postAiSchedule);
router.get('/schedule/status/:jobId', requireAuth, getAiScheduleStatus);

export default router;