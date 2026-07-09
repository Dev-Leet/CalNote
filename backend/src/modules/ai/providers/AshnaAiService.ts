import {
  AiProvider,
  SchedulingContext,
  NormalizedAiEventResponse,
  NormalizedAiEvent,
} from '../IAiSchedulerProvider';
import { ashnaSdkClient, AshnaRawResponse } from './ashna.client';
import { AppError } from '../../../utils/AppError';
import { logger } from '../../../utils/logger';

export class AshnaAiService implements AiProvider {
  readonly providerId = 'ashna' as const;

  async generateSchedule(context: SchedulingContext): Promise<NormalizedAiEventResponse> {
    let rawResponse: AshnaRawResponse;

    try {
      rawResponse = await ashnaSdkClient.schedule({
        prompt: context.prompt,
        currentDateTimeIST: context.currentDateTimeIST,
        context: {
          events: context.existingEvents,
          contests: context.upcomingContests,
          sleepWindow: context.preferences.sleepWindow,
        },
      });
    } catch (err) {
      logger.error({ err, userId: context.userId }, 'Ashna AI SDK call failed');
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Ashna AI request failed');
    }

    return this.mapAshnaResponse(rawResponse);
  }

  private mapAshnaResponse(raw: AshnaRawResponse): NormalizedAiEventResponse {
    const events: NormalizedAiEvent[] = raw.scheduledItems.map((item) => ({
      title: item.label,
      startTime: item.startsAt,
      endTime: item.endsAt,
      recurrence: item.repeatRule ?? null,
      notes: item.note ?? null,
      sourceContestId: item.linkedContestId ?? null,
    }));

    return {
      events,
      reasoning: raw.explanation,
      providerUsed: 'ashna',
    };
  }
}
