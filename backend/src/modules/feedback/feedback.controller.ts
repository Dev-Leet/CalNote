import { Request, Response, NextFunction } from 'express';
import { feedbackService } from './feedback.service';

export async function submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, message, rating, pageContext } = req.body;
    await feedbackService.submit({
      userId: req.user!.userId,
      category,
      message,
      rating,
      pageContext,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}