import { z } from 'zod';
import { GoogleGenAI, Type } from '@google/genai';
import { ashnaClient } from './providers/ashna.client';
import { EXTRACTION_SYSTEM_PROMPT } from './extraction.prompts';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const extractedItemSchema = z.object({
  day: z.string().min(1),
  event: z.string().min(1),
  attendance: z.string().min(1),
  dress_code: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  notes: z.string().min(1),
});
const extractedArraySchema = z.array(extractedItemSchema);

export type ExtractedScheduleItem = z.infer<typeof extractedItemSchema>;

const GEMINI_EXTRACTION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING },
      event: { type: Type.STRING },
      attendance: { type: Type.STRING },
      dress_code: { type: Type.STRING },
      time: { type: Type.STRING },
      location: { type: Type.STRING },
      notes: { type: Type.STRING },
    },
    required: ['day', 'event', 'attendance', 'dress_code', 'time', 'location', 'notes'],
  },
};

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

function parseAndValidate(raw: string): ExtractedScheduleItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    throw new AppError('AI_PROVIDER_ERROR', 502, 'Extraction returned non-JSON output');
  }
  const validated = extractedArraySchema.safeParse(parsed);
  if (!validated.success) {
    logger.error({ issues: validated.error.issues }, 'Extraction JSON failed contract validation');
    throw new AppError('AI_PROVIDER_ERROR', 502, 'Extraction output failed contract validation');
  }
  return validated.data;
}

/**
 * Distinct from the scheduling agent (ai.controller.ts) — this reads text
 * and structures it; it never itself decides WHEN to place things on a
 * calendar. Reuses ASHNA_NOTES_CODE_MODEL_ID / the same Gemini client as
 * the rest of the app rather than requiring a third dedicated agent ID,
 * since this is fundamentally a text-analysis task like Notes Q&A.
 */
export class ExtractionService {
  async extract(rawText: string, provider: 'ashna' | 'custom'): Promise<ExtractedScheduleItem[]> {
    if (!rawText.trim()) {
      throw new AppError('VALIDATION_ERROR', 400, 'Text to extract must not be empty');
    }

    if (provider === 'ashna') {
      const modelId = process.env.ASHNA_NOTES_CODE_MODEL_ID;
      if (!modelId) throw new AppError('AI_PROVIDER_UNAVAILABLE', 422, 'Ashna extraction agent is not configured');

      const response = await ashnaClient.chatCompletion({
        model: modelId,
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: rawText },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });
      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new AppError('AI_PROVIDER_ERROR', 502, 'Extraction returned an empty response');
      return parseAndValidate(content);
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new AppError('AI_PROVIDER_UNAVAILABLE', 422, 'Gemini is not configured');

    const client = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: rawText,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: GEMINI_EXTRACTION_SCHEMA,
        maxOutputTokens: 1500,
        temperature: 0.2,
      },
    });
    if (!response.text) throw new AppError('AI_PROVIDER_ERROR', 502, 'Extraction returned an empty response');
    return parseAndValidate(response.text);
  }
}

export const extractionService = new ExtractionService();