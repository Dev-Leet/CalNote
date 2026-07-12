import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { listEvents, createEvent, updateEvent, deleteEvent } from './event.controller';
import { getUpcomingGoogleEvents } from './googleCalendarFetch.controller';

const router = Router();
router.use(requireAuth);

const listQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).or(z.string().date()),
  to: z.string().datetime({ offset: true }).or(z.string().date()),
  source: z.enum(['manual', 'ai-ashna', 'ai-custom']).optional(),
});

const recurrenceSchema = z
  .object({
    freq: z.enum(['daily', 'weekly', 'custom']),
    interval: z.number().int().positive(),
    byDay: z.array(z.string()).optional(),
    until: z.string().datetime({ offset: true }).optional(),
    rruleString: z.string().min(1).optional(),
  })
  .refine((r) => r.freq !== 'custom' || !!r.rruleString, {
    message: "recurrence.rruleString is required when freq is 'custom'",
    path: ['rruleString'],
  });

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  recurrence: recurrenceSchema.optional(),
  force: z.boolean().optional(),
});

const updateEventSchema = createEventSchema.partial();

router.get('/', validate(listQuerySchema, 'query'), listEvents);
router.get('/google/upcoming', getUpcomingGoogleEvents);
router.post('/', validate(createEventSchema), createEvent);
router.patch('/:id', validate(updateEventSchema), updateEvent);
router.delete('/:id', deleteEvent);

export default router;