import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { contestService } from './contest.service';
import { triggerImmediateScrape } from './contest.cron';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform, from, to } = req.query as { platform?: string; from?: string; to?: string };
    const contests = await contestService.getContests({
      platform,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    res.status(200).json({ contests });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', requireAuth, requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await triggerImmediateScrape();
    res.status(202).json({ message: 'Scrape triggered' });
  } catch (err) {
    next(err);
  }
});

export default router;
