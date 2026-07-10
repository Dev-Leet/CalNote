/**
 * Backend-side ambient type declarations shared across modules. Mirrors the
 * frontend's src/types/shared.d.ts DTO shapes so both sides of the API
 * boundary agree on wire format, per Section 9.3's stated intent.
 */

export type EventSource = 'manual' | 'ai-ashna' | 'ai-custom';
export type AiProviderType = 'ashna' | 'custom';
export type RecurrenceFreq = 'daily' | 'weekly' | 'custom';

export interface RecurrenceRuleDto {
  freq: RecurrenceFreq;
  interval: number;
  byDay?: string[];
  until?: string | null;
}

export interface EventDto {
  _id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  source: EventSource;
  sourceContestId?: string;
  recurrence?: RecurrenceRuleDto;
  aiReasoning?: string;
  googleCalendarEventId?: string;
  noteId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContestDto {
  _id: string;
  platform: string;
  externalId: string;
  name: string;
  startTime: string;
  endTime: string;
  url: string;
  durationMinutes: number;
}

export interface NoteDto {
  _id: string;
  userId: string;
  eventId?: string;
  contentRichText: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublicDto {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}
