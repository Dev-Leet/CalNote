// apps/api/src/routes/calendarRoutes.ts
import { Router } from 'express';
import { calendarController } from '../controllers/calendarController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);
router.post('/sync', (req, res) => calendarController.syncContests(req as any, res));
router.get('/status', (req, res) => calendarController.getStatus(req as any, res));

export default router;
