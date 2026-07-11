import { Request, Response, NextFunction } from 'express';
import { contestService } from './contest.service';
import { triggerImmediateScrape } from './contest.cron';

export async function listContests(req: Request, res: Response, next: NextFunction): Promise<void> {
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
}

export async function getContestById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ContestModel } = await import('../../models/Contest.model');
    const contest = await ContestModel.findById(req.params.id).lean();
    if (!contest) {
      const { AppError } = await import('../../utils/AppError');
      throw new AppError('NOT_FOUND', 404, 'Contest not found');
    }
    res.status(200).json({ contest });
  } catch (err) {
    next(err);
  }
}

export async function refreshContests(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await triggerImmediateScrape();
    res.status(202).json({ message: 'Scrape triggered' });
  } catch (err) {
    next(err);
  }
}
