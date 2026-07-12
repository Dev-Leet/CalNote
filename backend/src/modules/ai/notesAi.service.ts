import { NOTES_AI_SYSTEM_PROMPT, buildNotesAiUserMessage } from './notesAi.prompts';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const ASHNA_API_BASE_URL = process.env.ASHNA_API_BASE_URL ?? 'https://api.ashna.ai/v1';
const ASHNA_API_KEY = process.env.ASHNA_API_KEY;

export interface NotesAiAskInput {
  selectedText: string;
  instruction: 'explain' | 'review_errors' | 'optimise' | 'custom';
  customQuestion?: string;
  noteContext?: string;
}

/**
 * Ashna AI is described (per project context) as exposing an
 * OpenAI-compatible Chat Completions API. This calls it directly with a
 * plain-text response — deliberately NOT routed through AiProviderFactory,
 * since that abstraction's contract (NormalizedAiEventResponse) is specific
 * to calendar scheduling, not general Q&A. If a second provider is ever
 * needed for Notes AI, THIS is the place to introduce a small
 * NotesAiProvider interface — not a reason to force scheduling's Strategy
 * Pattern to serve an unrelated shape of request.
 */
export class NotesAiService {
  async ask(input: NotesAiAskInput): Promise<string> {
    if (!ASHNA_API_KEY) {
      throw new AppError('AI_PROVIDER_UNAVAILABLE', 422, 'Ashna AI is not configured');
    }
    if (!input.selectedText.trim()) {
      throw new AppError('VALIDATION_ERROR', 400, 'selectedText must not be empty');
    }
    if (input.instruction === 'custom' && !input.customQuestion?.trim()) {
      throw new AppError('VALIDATION_ERROR', 400, 'customQuestion is required when instruction is "custom"');
    }

    const userMessage = buildNotesAiUserMessage(input);

    let response: Response;
    try {
      response = await fetch(`${ASHNA_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ASHNA_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'ashna-standard', // adjust to the actual Ashna model identifier once confirmed
          messages: [
            { role: 'system', content: NOTES_AI_SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.4,
          max_tokens: 500,
        }),
      });
    } catch (err) {
      logger.error({ err }, 'Ashna AI notes request failed to send');
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Failed to reach Ashna AI');
    }

    if (!response.ok) {
      logger.error({ status: response.status }, 'Ashna AI notes request returned non-OK status');
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Ashna AI returned an error');
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const answer = data.choices?.[0]?.message?.content;
    if (!answer) {
      throw new AppError('AI_PROVIDER_ERROR', 502, 'Ashna AI returned an empty response');
    }

    return answer;
  }
}

export const notesAiService = new NotesAiService();