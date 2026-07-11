import { IEvent } from '../models/Event.model';
import { toIST } from './timezone';
import { Types } from 'mongoose';

/**
 * The minimal shape serializeContest actually needs — deliberately NOT
 * IContest (a full Mongoose Document). This lets both hydrated documents
 * AND .lean() query results (which lack Document methods) satisfy it via
 * plain structural typing, with no cast required at either call site.
 */
export interface ContestLike {
  _id: Types.ObjectId;
  platform: string;
  externalId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  url: string;
  durationMinutes: number;
}

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
export function serializeContest(contest: ContestLike) {
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

export function serializeContests(contests: ContestLike[]) {
  return contests.map(serializeContest);
}