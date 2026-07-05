// apps/api/src/controllers/calendarController.ts
// Google Calendar sync handlers

import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { calendarService } from '../services/calendarService';
import { logger } from '../config/logger';

class CalendarController {
  /** POST /calendar/sync */
  async syncContests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { contestIds } = req.body as { contestIds?: string[] };
      const result = await calendarService.syncContests(req.user!.userId, contestIds);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('syncContests error:', error);
      res.status(500).json({ success: false, message: 'Failed to sync contests' });
    }
  }

  /** GET /calendar/status */
  async getStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const status = await calendarService.getStatus(req.user!.userId);
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('calendarStatus error:', error);
      res.status(500).json({ success: false, message: 'Failed to get calendar status' });
    }
  }
}

export const calendarController = new CalendarController();
