// apps/api/src/controllers/contestController.ts
// Contest HTTP handlers

import { Request, Response } from 'express';
import { contestService } from '../services/contestService';
import { logger } from '../config/logger';
import { NotFoundError } from '../middlewares/errorHandler';

class ContestController {
  /** GET /contests */
  async getContests(req: Request, res: Response): Promise<void> {
    try {
      const { platform, upcoming, page, limit } = req.query;

      const result = await contestService.getContests({
        platform: platform as string | undefined,
        upcoming: upcoming === 'true',
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('getContests error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch contests' });
    }
  }

  /** GET /contests/upcoming */
  async getUpcomingContests(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const contests = await contestService.getUpcomingContests(days);
      res.json({ success: true, data: contests });
    } catch (error) {
      logger.error('getUpcomingContests error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch upcoming contests' });
    }
  }

  /** GET /contests/today */
  async getTodayContests(req: Request, res: Response): Promise<void> {
    try {
      const contests = await contestService.getTodayContests();
      res.json({ success: true, data: contests });
    } catch (error) {
      logger.error('getTodayContests error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch today\'s contests' });
    }
  }

  /** GET /contests/stats */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await contestService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('getStats error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
  }

  /** GET /contests/:id */
  async getContestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const contest = await contestService.getContestById(id);
      if (!contest) throw new NotFoundError('Contest');
      res.json({ success: true, data: contest });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      logger.error('getContestById error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch contest' });
    }
  }
}

export const contestController = new ContestController();
