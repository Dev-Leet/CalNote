import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { listContests, getContestById, refreshContests } from './contest.controller';

const router = Router();

const listContestsQuerySchema = z.object({
  platform: z.string().optional(),
  from: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  to: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  includePast: z.enum(['true', 'false']).optional(),
});

router.get('/', requireAuth, validate(listContestsQuerySchema, 'query'), listContests);
router.get('/:id', requireAuth, getContestById);
router.post('/refresh', requireAuth, requireRole('admin'), refreshContests);

export default router;
