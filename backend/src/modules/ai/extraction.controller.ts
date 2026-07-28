import { Request, Response, NextFunction } from 'express';
import { extractionService } from './extraction.service';
import { UserModel } from '../../models/User.model';
import { AppError } from '../../utils/AppError';

export async function extractSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, provider } = req.body as { text: string; provider?: 'ashna' | 'custom' };
    const user = await UserModel.findById(req.user!.userId);
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

    const resolvedProvider = provider ?? user.preferences.defaultAiProvider;
    const items = await extractionService.extract(text, resolvedProvider);
    res.status(200).json({ items, providerUsed: resolvedProvider });
  } catch (err) {
    next(err);
  }
}