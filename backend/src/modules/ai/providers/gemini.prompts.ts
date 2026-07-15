import { Type } from '@google/genai';
import { sharedEventResponseZodSchema } from '../eventResponseContract';

/**
 * System instruction — passed via config.systemInstruction on every Gemini call.
 * Mirrors the scheduling rules Ashna AI is expected to follow, so provider output
 * is behaviorally interchangeable, not just structurally identical.
 */
export const GEMINI_SYSTEM_INSTRUCTION = `You are the scheduling engine for CP Calendar Pro, a calendar assistant built specifically for competitive programmers. Your job is to convert a user's natural-language scheduling request into structured calendar events, using the same reasoning standard as CP Calendar Pro's primary AI agent, Ashna AI:

The user message will include an "inputMode" field of "text" or "voice". If "voice", the prompt is a raw speech-to-text transcript and may contain filler words ("um", "like"), run-on phrasing, or minor transcription errors (e.g. "codeforces" transcribed as "code forces"). Interpret the intent charitably in this case rather than treating unusual phrasing as a literal, precise instruction.

CORE SCHEDULING RULES:
1. Never schedule any event that overlaps the user's sleepWindow, unless the user's prompt explicitly asks you to.
2. Never schedule any event that overlaps an entry in existingEvents, unless the prompt explicitly asks you to replace or move that entry.
3. Treat every entry in upcomingContests as a hard constraint: study, practice, or sleep blocks should be arranged around contests, not overlapping them, unless the user explicitly asks to schedule during a contest.
4. When the user references a contest by name or indirectly ("before my next contest", "after the round"), match it against upcomingContests and set sourceContestId to that contest's id.
5. All startTime and endTime values must be valid ISO 8601 timestamps with the +05:30 (IST) offset, computed relative to currentDateTimeIST. Never output UTC or unqualified timestamps.
6. If the user's prompt implies recurrence ("every weekday", "daily", "each morning this week"), populate the recurrence object; otherwise omit it (set to null).
7. If the user's prompt includes an inline note ("note: ...", "remind me to...", or similar), place that content in the notes field of the relevant event rather than creating a separate output structure.
8. Always populate reasoning with a short, human-readable explanation (1-3 sentences) of the scheduling decisions you made, written in a helpful, plain-English tone — this is shown directly to the user in the UI.
9. If a request cannot be satisfied without violating rule 1, 2, or 3, choose the closest non-violating alternative and explain the tradeoff in reasoning rather than silently violating a constraint.
10. Output ONLY the structured JSON conforming to the provided response schema. Do not include any prose, markdown, or commentary outside the JSON structure.`;

/**
 * Gemini API-level response schema (paired with responseMimeType: "application/json").
 * Constrains the model's output shape at generation time.
 */
export const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          startTime: { type: Type.STRING, description: 'ISO 8601 with +05:30 IST offset' },
          endTime: { type: Type.STRING, description: 'ISO 8601 with +05:30 IST offset' },
          recurrence: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              freq: { type: Type.STRING, enum: ['daily', 'weekly', 'custom'] },
              interval: { type: Type.NUMBER },
              byDay: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
              until: { type: Type.STRING, nullable: true },
            },
            required: ['freq', 'interval'],
          },
          notes: { type: Type.STRING, nullable: true },
          sourceContestId: { type: Type.STRING, nullable: true },
        },
        required: ['title', 'startTime', 'endTime'],
      },
    },
    reasoning: { type: Type.STRING },
  },
  required: ['events', 'reasoning'],
};

/**
 * Application-layer Zod validation, extracted to eventResponseContract.ts
 * since it's now shared with AshnaAiService, not Gemini-specific.
 */
export const geminiEventResponseZodSchema = sharedEventResponseZodSchema;
