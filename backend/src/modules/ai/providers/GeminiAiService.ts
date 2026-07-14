import { GoogleGenAI } from '@google/genai';
import {
  AiProvider,
  SchedulingContext,
  NormalizedAiEventResponse,
} from '../IAiSchedulerProvider';
import { GEMINI_SYSTEM_INSTRUCTION, GEMINI_RESPONSE_SCHEMA } from './gemini.prompts';
import { normalizeGeminiResponse } from '../normalizeResponse';
import { AppError } from '../../../utils/AppError';
import { logger } from '../../../utils/logger';

const COMPLEX_KEYWORDS = ['reschedule', 'around', 'avoid', 'entire week', 'rearrange', 'balance'];

function estimatePromptComplexity(prompt: string, contestCount: number): 'simple' | 'complex' {
  const lower = prompt.toLowerCase();
  const keywordHits = COMPLEX_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  const isLong = prompt.length > 180;
  return keywordHits >= 2 || (isLong && contestCount > 1) ? 'complex' : 'simple';
}

function selectGeminiModel(complexity: 'simple' | 'complex'): string {
  return complexity === 'complex' ? 'gemini-2.5-pro' : 'gemini-3.5-flash';
}

function buildGeminiContents(context: SchedulingContext): string {
  const payload = {
    instruction: 'Generate calendar events for the following scheduling request, using the context provided.',
    userRequest: context.prompt,
    inputMode: context.inputMode,
    currentDateTimeIST: context.currentDateTimeIST,
    sleepWindow: context.preferences.sleepWindow,
    existingEvents: context.existingEvents,
    upcomingContests: context.upcomingContests,
  };
  return JSON.stringify(payload);
}

export class GeminiAiService implements AiProvider {
  readonly providerId = 'custom' as const;

  constructor(private readonly client: GoogleGenAI) {}

  async generateSchedule(context: SchedulingContext): Promise<NormalizedAiEventResponse> {
    const complexity = estimatePromptComplexity(context.prompt, context.upcomingContests.length);
    const model = selectGeminiModel(complexity);
    const contents = buildGeminiContents(context);

    let response;
    try {
      response = await this.client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          maxOutputTokens: 1024,
          temperature: 0.3,
        },
      });
    } catch (err) {
      logger.error({ err, model, userId: context.userId }, 'Gemini API call failed');
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Gemini API request failed');
    }

    logger.info(
      { usage: response.usageMetadata, model, userId: context.userId },
      'Gemini schedule request completed',
    );

    return normalizeGeminiResponse(response.text ?? '');
  }
}
