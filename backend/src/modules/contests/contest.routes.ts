import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { listContests, getContestById, refreshContests } from './contest.controller';

const router = Router();

router.get('/', requireAuth, listContests);
router.get('/:id', requireAuth, getContestById);
router.post('/refresh', requireAuth, requireRole('admin'), refreshContests);

export default router;
