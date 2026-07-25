import { Request, Response, NextFunction } from 'express';
import { googleCalendarSyncService } from './googleCalendar.sync';

export async function pushAllToGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await googleCalendarSyncService.pushAllUnsyncedEvents(req.user!.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}