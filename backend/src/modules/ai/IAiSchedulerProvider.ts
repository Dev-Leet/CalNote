/**
 * Shared Strategy Pattern contract. Every AI provider — Ashna or Gemini —
 * must consume SchedulingContext and produce NormalizedAiEventResponse.
 * No consumer outside this module should ever import a concrete provider directly.
 */

export type AiProviderId = 'ashna' | 'custom';

export interface CompactEvent {
  title: string;
  start: string; // ISO 8601, IST offset (+05:30)
  end: string;
}

export interface CompactContest {
  name: string;
  platform: string;
  start: string; // ISO 8601, IST offset
  end: string;
}

export interface SchedulingPreferences {
  sleepWindow: { start: string; end: string };
  timezone: 'Asia/Kolkata';
}

export interface SchedulingContext {
  userId: string;
  prompt: string;
  currentDateTimeIST: string; // ISO 8601, IST offset
  existingEvents: CompactEvent[];
  upcomingContests: CompactContest[];
  preferences: SchedulingPreferences;
}

export interface NormalizedRecurrence {
  freq: 'daily' | 'weekly' | 'custom';
  interval: number;
  byDay?: string[];
  until?: string | null;
}

export interface NormalizedAiEvent {
  title: string;
  startTime: string; // ISO 8601, IST offset
  endTime: string;
  recurrence?: NormalizedRecurrence | null;
  notes?: string | null;
  sourceContestId?: string | null;
}

export interface NormalizedAiEventResponse {
  events: NormalizedAiEvent[];
  reasoning: string;
  providerUsed: AiProviderId;
}

/**
 * The Strategy interface itself.
 */
export interface AiProvider {
  readonly providerId: AiProviderId;
  generateSchedule(context: SchedulingContext): Promise<NormalizedAiEventResponse>;
}
