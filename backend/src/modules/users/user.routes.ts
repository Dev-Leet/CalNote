import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getPreferences, updatePreferences } from './user.controller';

const router = Router();
router.use(requireAuth);

const sleepWindowSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm'),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm'),
});

const profileLinkSchema = z.object({
  platform: z.string().min(1).max(30),
  label: z.string().min(1).max(40),
  url: z.string().url(),
});

const updatePreferencesSchema = z.object({
  defaultAiProvider: z.enum(['ashna', 'custom']).optional(),
  sleepWindow: sleepWindowSchema.optional(),
  notifyBeforeContestMins: z.number().int().min(0).max(1440).optional(),
  customAiConfig: z
    .object({
      endpoint: z.string().url(),
      apiKey: z.string().min(10),
      model: z.string().min(1),
    })
    .optional(),
  profileLinks: z.array(profileLinkSchema).max(10).optional(),
});

router.get('/me/preferences', getPreferences);
router.patch('/me/preferences', validate(updatePreferencesSchema), updatePreferences);

export default router;
