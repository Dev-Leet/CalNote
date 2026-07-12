import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../../models/User.model';
import { googleCalendarSyncService } from './googleCalendar.sync';
import { AppError } from '../../utils/AppError';

export async function getUpcomingGoogleEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UserModel.findById(req.user!.userId).select('+googleRefreshToken');
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    if (!user.googleRefreshToken) {
      // Not an error — the user simply hasn't linked Google Calendar yet.
      // Empty array lets the frontend render an "unlinked" empty state
      // rather than an error toast.
      res.status(200).json({ events: [], linked: false });
      return;
    }

    const events = await googleCalendarSyncService.fetchUpcomingEvents(user);
    res.status(200).json({ events, linked: true });
  } catch (err) {
    next(err);
  }
}