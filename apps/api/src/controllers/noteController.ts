// apps/api/src/controllers/noteController.ts
// Notes CRUD + AI generation handlers

import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { noteService } from '../services/noteService';
import { logger } from '../config/logger';
import { NotFoundError } from '../middlewares/errorHandler';

class NoteController {
  /** GET /notes */
  async getNotes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const notes = await noteService.getNotesByUser(
        req.user!.userId,
        req.query.contestId as string | undefined
      );
      res.json({ success: true, data: notes });
    } catch (error) {
      logger.error('getNotes error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
  }

  /** GET /notes/:id */
  async getNoteById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const note = await noteService.getNoteById(req.params.id, req.user!.userId);
      res.json({ success: true, data: note });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      logger.error('getNoteById error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch note' });
    }
  }

  /** POST /notes */
  async createNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const note = await noteService.createNote({
        userId: req.user!.userId,
        contestId: req.body.contestId,
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags,
      });
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      logger.error('createNote error:', error);
      res.status(500).json({ success: false, message: 'Failed to create note' });
    }
  }

  /** PUT /notes/:id */
  async updateNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const note = await noteService.updateNote(req.params.id, req.user!.userId, {
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags,
      });
      res.json({ success: true, data: note });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      logger.error('updateNote error:', error);
      res.status(500).json({ success: false, message: 'Failed to update note' });
    }
  }

  /** DELETE /notes/:id */
  async deleteNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      await noteService.deleteNote(req.params.id, req.user!.userId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      logger.error('deleteNote error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete note' });
    }
  }

  /** POST /notes/generate */
  async generateNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const note = await noteService.generateNote({
        userId: req.user!.userId,
        contestId: req.body.contestId,
        userPrompt: req.body.userPrompt,
        skillLevel: req.body.skillLevel,
      });
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      logger.error('generateNote error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate note' });
    }
  }
}

export const noteController = new NoteController();
