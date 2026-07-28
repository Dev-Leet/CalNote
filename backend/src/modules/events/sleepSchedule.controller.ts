import { Request, Response, NextFunction } from 'express';
import { sleepScheduleService } from './sleepSchedule.service';
import { UserModel } from '../../models/User.model';
import { AppError } from '../../utils/AppError';

export async function generateSleepSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

    const result = await sleepScheduleService.generateSchedule(req.user!.userId, user.preferences.sleepWindow);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Called before actually regenerating, so the frontend can show "you have
 * N upcoming auto-scheduled sleep blocks — replace them with your updated
 * sleep window?" and get explicit confirmation, rather than the backend
 * silently clearing+recreating on every preference save.
 */
export async function getFutureSleepBlockCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await sleepScheduleService.countFutureAutoSleepBlocks(req.user!.userId);
    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
}

export async function regenerateSleepSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

    await sleepScheduleService.clearFutureAutoSleepBlocks(req.user!.userId);
    const result = await sleepScheduleService.generateSchedule(req.user!.userId, user.preferences.sleepWindow);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}