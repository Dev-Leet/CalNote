import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createNote, listNotes, updateNote, deleteNote } from './notes.controller';

const router = Router();

const createNoteSchema = z.object({
  contentRichText: z.string().min(1),
  eventId: z.string().optional(),
});

const updateNoteSchema = z.object({
  contentRichText: z.string().min(1),
});

router.use(requireAuth);
router.post('/', validate(createNoteSchema), createNote);
router.get('/', listNotes);
router.patch('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

export default router;
