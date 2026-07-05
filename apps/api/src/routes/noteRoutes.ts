// apps/api/src/routes/noteRoutes.ts
import { Router } from 'express';
import { noteController } from '../controllers/noteController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// All note routes require authentication
router.use(requireAuth);

router.get('/', (req, res) => noteController.getNotes(req as any, res));
router.get('/:id', (req, res) => noteController.getNoteById(req as any, res));
router.post('/', (req, res) => noteController.createNote(req as any, res));
router.post('/generate', (req, res) => noteController.generateNote(req as any, res));
router.put('/:id', (req, res) => noteController.updateNote(req as any, res));
router.delete('/:id', (req, res) => noteController.deleteNote(req as any, res));

export default router;
