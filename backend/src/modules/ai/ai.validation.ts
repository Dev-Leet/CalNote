import { z } from 'zod';

export const aiScheduleBodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  provider: z.enum(['ashna', 'custom']).optional(),
  dateRangeHint: z
    .object({
      from: z.string().datetime({ offset: true }).or(z.string().date()),
      to: z.string().datetime({ offset: true }).or(z.string().date()),
    })
    .optional(),
});

export type AiScheduleInput = z.infer<typeof aiScheduleBodySchema>;