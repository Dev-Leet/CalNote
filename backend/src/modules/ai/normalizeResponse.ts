import { geminiEventResponseZodSchema } from './providers/gemini.prompts';
import { NormalizedAiEventResponse } from './IAiSchedulerProvider';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

/**
 * Parses and validates raw Gemini JSON text into a NormalizedAiEventResponse.
 * Isolated here (rather than as a private GeminiAiService method) so it can
 * be unit tested independently of the network call, per Section 12.3's
 * worked examples — those fixtures are exactly what this function should
 * be tested against.
 */
export function normalizeGeminiResponse(rawText: string): NormalizedAiEventResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new AppError('AI_PROVIDER_ERROR', 502, 'Gemini returned non-JSON despite schema enforcement');
  }

  const validated = geminiEventResponseZodSchema.safeParse(parsed);
  if (!validated.success) {
    logger.error({ issues: validated.error.issues }, 'Gemini JSON failed Zod contract validation');
    throw new AppError('AI_PROVIDER_ERROR', 502, 'Gemini JSON failed contract validation');
  }

  return {
    events: validated.data.events,
    reasoning: validated.data.reasoning,
    providerUsed: 'custom',
  };
}
