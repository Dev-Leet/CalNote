import { AiProvider, SchedulingContext, NormalizedAiEventResponse } from '../IAiSchedulerProvider';
import { ashnaClient } from './ashna.client';
import { ASHNA_CALENDAR_SYSTEM_PROMPT } from './ashna.prompts';
import { normalizeAshnaResponse } from '../normalizeAshnaResponse';
import { AppError } from '../../../utils/AppError';
import { logger } from '../../../utils/logger';

const ASHNA_CALENDAR_MODEL_ID = process.env.ASHNA_CALENDAR_MODEL_ID as string;

export class AshnaAiService implements AiProvider {
  readonly providerId = 'ashna' as const;

  async generateSchedule(context: SchedulingContext): Promise<NormalizedAiEventResponse> {
    if (!ASHNA_CALENDAR_MODEL_ID) {
      throw new AppError('AI_PROVIDER_UNAVAILABLE', 422, 'ASHNA_CALENDAR_MODEL_ID is not configured');
    }

    const userPayload = JSON.stringify({
      userRequest: context.prompt,
      inputMode: context.inputMode,
      currentDateTimeIST: context.currentDateTimeIST,
      sleepWindow: context.preferences.sleepWindow,
      existingEvents: context.existingEvents,
      upcomingContests: context.upcomingContests,
    });

    let response;
    try {
      response = await ashnaClient.chatCompletion({
        model: ASHNA_CALENDAR_MODEL_ID,
        messages: [
          { role: 'system', content: ASHNA_CALENDAR_SYSTEM_PROMPT },
          { role: 'user', content: userPayload },
        ],
        temperature: 0.3, // precision task, not creative writing — matches Gemini's setting
        max_tokens: 1024,
      });
    } catch (err) {
      logger.error({ err, userId: context.userId }, 'Ashna AI chat completion request failed');
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Ashna AI request failed');
    }

    logger.info(
      { usage: response.usage, model: ASHNA_CALENDAR_MODEL_ID, userId: context.userId },
      'Ashna schedule request completed',
    );

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Ashna AI returned an empty response');
    }

    return normalizeAshnaResponse(content);
  }
}