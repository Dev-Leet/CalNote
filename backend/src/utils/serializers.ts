import { IEvent } from '../models/Event.model';
import { IContest } from '../models/Contest.model';
import { toIST } from './timezone';

/**
 * Converts a hydrated Event document into its wire-format DTO: ObjectIds as
 * strings, Date fields as IST-offset ISO strings, matching the documented
 * API contract (SRS 3.4.3) that every prior controller silently skipped.
 */
export function serializeEvent(event: IEvent) {
  return {
    _id: event._id.toString(),
    userId: event.userId.toString(),
    title: event.title,
    startTime: toIST(event.startTime),
    endTime: toIST(event.endTime),
    source: event.source,
    sourceContestId: event.sourceContestId?.toString(),
    recurrence: event.recurrence
      ? {
          freq: event.recurrence.freq,
          interval: event.recurrence.interval,
          byDay: event.recurrence.byDay,
          until: event.recurrence.until ? toIST(event.recurrence.until) : undefined,
        }
      : undefined,
    aiReasoning: event.aiReasoning,
    googleCalendarEventId: event.googleCalendarEventId,
    noteId: event.noteId?.toString(),
    createdAt: toIST(event.createdAt),
    updatedAt: toIST(event.updatedAt),
  };
}

export function serializeEvents(events: IEvent[]) {
  return events.map(serializeEvent);
}

/**
 * Handles both hydrated Mongoose documents and .lean() plain objects —
 * contest.service.ts's getContests() returns lean results, which have no
 * Document methods, so this can't assume `.toObject()` exists.
 */
export function serializeContest(contest: IContest) {
  return {
    _id: contest._id.toString(),
    platform: contest.platform,
    externalId: contest.externalId,
    name: contest.name,
    startTime: toIST(contest.startTime),
    endTime: toIST(contest.endTime),
    url: contest.url,
    durationMinutes: contest.durationMinutes,
  };
}

export function serializeContests(contests: IContest[]) {
  return contests.map(serializeContest);
}