import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { eventService } from './event.service';
import { AppError } from '../../utils/AppError';

const router = Router();
router.use(requireAuth);

const listQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).or(z.string().date()),
  to: z.string().datetime({ offset: true }).or(z.string().date()),
  source: z.enum(['manual', 'ai-ashna', 'ai-custom']).optional(),
});

router.get('/', validate(listQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as unknown as { from: string; to: string };
    const events = await eventService.getEventsInRange(req.user!.userId, new Date(from), new Date(to));
    res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
});

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  recurrence: z
    .object({
      freq: z.enum(['daily', 'weekly', 'custom']),
      interval: z.number().int().positive(),
      byDay: z.array(z.string()).optional(),
      until: z.string().datetime({ offset: true }).optional(),
    })
    .optional(),
  force: z.boolean().optional(),
});

router.post('/', validate(createEventSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const event = await eventService.createEvent({
      userId: req.user!.userId,
      title: body.title,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      recurrence: body.recurrence,
      force: body.force,
    });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await eventService.deleteEvent(req.user!.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
