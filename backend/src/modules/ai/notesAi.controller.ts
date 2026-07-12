import { Request, Response, NextFunction } from 'express';
import { notesAiService } from './notesAi.service';

export async function askNotesAi(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { selectedText, instruction, customQuestion, noteContext } = req.body;
    const answer = await notesAiService.ask({ selectedText, instruction, customQuestion, noteContext });
    res.status(200).json({ answer });
  } catch (err) {
    next(err);
  }
}