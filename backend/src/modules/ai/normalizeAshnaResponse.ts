import { sharedEventResponseZodSchema } from './eventResponseContract';
import { NormalizedAiEventResponse } from './IAiSchedulerProvider';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

/**
 * Ashna has no documented JSON-mode parameter, so this is the ONLY
 * validation layer standing between raw model output and the database —
 * unlike Gemini, which has responseSchema as a first line of defense too.
 * Also strips markdown code fences defensively: even with rule 10 in the
 * system prompt telling Ashna not to wrap output in ```json fences, chat
 * models frequently do it anyway out of habit — cheap to guard against.
 */
export function normalizeAshnaResponse(rawText: string): NormalizedAiEventResponse {
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new AppError('AI_PROVIDER_ERROR', 502, 'Ashna AI returned non-JSON output');
  }

  const validated = sharedEventResponseZodSchema.safeParse(parsed);
  if (!validated.success) {
    logger.error({ issues: validated.error.issues }, 'Ashna JSON failed contract validation');
    throw new AppError('AI_PROVIDER_ERROR', 502, 'Ashna AI JSON failed contract validation');
  }

  return {
    events: validated.data.events.map((e) => ({
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
      recurrence: e.recurrence
        ? {
            freq: e.recurrence.freq,
            interval: e.recurrence.interval,
            byDay: e.recurrence.byDay ?? undefined,
            until: e.recurrence.until ?? undefined,
          }
        : undefined,
      notes: e.notes ?? undefined,
      sourceContestId: e.sourceContestId ?? undefined,
    })),
    reasoning: validated.data.reasoning,
    providerUsed: 'ashna',
  };
}