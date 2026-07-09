import { Request, Response, NextFunction } from 'express';
import { notesService } from './notes.service';

export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await notesService.createNote({
      userId: req.user!.userId,
      contentRichText: req.body.contentRichText,
      eventId: req.body.eventId,
    });
    res.status(201).json({ note });
  } catch (err) {
    next(err);
  }
}

export async function listNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notes = await notesService.getNotes(req.user!.userId, req.query.eventId as string | undefined);
    res.status(200).json({ notes });
  } catch (err) {
    next(err);
  }
}

export async function updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await notesService.updateNote(req.user!.userId, req.params.id, {
      contentRichText: req.body.contentRichText,
    });
    res.status(200).json({ note });
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cascade = req.query.cascadeNote === 'true';
    await notesService.deleteNote(req.user!.userId, req.params.id, cascade);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
