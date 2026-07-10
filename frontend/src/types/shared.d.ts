/**
 * Shared DTO types mirroring backend contracts. Kept as ambient declarations
 * here so components/hooks import a single source of truth instead of
 * redefining these shapes per-file (Section 9.3's stated intent).
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
  startTime: string; // IST ISO string
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

export interface UserPreferencesDto {
  defaultAiProvider: AiProviderType;
  sleepWindow: { start: string; end: string };
  timezone: 'Asia/Kolkata';
  notifyBeforeContestMins: number;
  customAiConfig?: { endpoint: string; model: string; hasApiKey: boolean };
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}