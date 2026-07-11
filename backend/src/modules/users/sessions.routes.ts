import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { listSessions, revokeSession } from './sessions.controller';

const router = Router();
router.use(requireAuth);

router.get('/', listSessions);
router.delete('/:deviceId', revokeSession);

export default router;