import { z } from 'zod';

/**
 * The JSON contract BOTH Ashna and Gemini must produce, validated
 * independently of whatever API-level format enforcement (or lack thereof)
 * each provider offers. Ashna's docs show no response_format/JSON-mode
 * parameter at all, so this Zod layer is the ONLY structural guarantee for
 * that provider — not a defense-in-depth extra, but the sole safety net.
 */
const recurrenceZodSchema = z
  .object({
    freq: z.enum(['daily', 'weekly', 'custom']),
    interval: z.number().int().positive(),
    byDay: z.array(z.string()).nullable().optional(),
    until: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

const eventZodSchema = z
  .object({
    title: z.string().min(1).max(200),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    recurrence: recurrenceZodSchema,
    notes: z.string().nullable().optional(),
    sourceContestId: z.string().nullable().optional(),
  })
  .refine((event) => new Date(event.endTime) > new Date(event.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export const sharedEventResponseZodSchema = z.object({
  events: z.array(eventZodSchema).min(1),
  reasoning: z.string().min(1).max(1000),
});