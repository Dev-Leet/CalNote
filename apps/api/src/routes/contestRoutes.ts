// apps/api/src/routes/contestRoutes.ts
import { Router } from 'express';
import { contestController } from '../controllers/contestController';

const router = Router();

router.get('/', (req, res) => contestController.getContests(req, res));
router.get('/upcoming', (req, res) => contestController.getUpcomingContests(req, res));
router.get('/today', (req, res) => contestController.getTodayContests(req, res));
router.get('/stats', (req, res) => contestController.getStats(req, res));
router.get('/:id', (req, res) => contestController.getContestById(req, res));

export default router;
