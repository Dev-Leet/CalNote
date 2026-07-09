import { Types } from 'mongoose';
import { EventModel, IEvent, IRecurrenceRule } from '../../models/Event.model';
import { AppError } from '../../utils/AppError';
import { rangesOverlap } from '../../utils/timezone';
import { DateTime } from 'luxon';

export interface CreateEventInput {
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  source?: 'manual' | 'ai-ashna' | 'ai-custom';
  sourceContestId?: string;
  recurrence?: IRecurrenceRule;
  aiReasoning?: string;
  noteId?: string;
  force?: boolean; // bypass conflict check if true
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingEventIds: string[];
}

const WEEKDAY_MAP: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

export class EventService {
  /**
   * FR-4.2: detect whether a proposed [startTime, endTime) range overlaps
   * any existing event for this user.
   */
  async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string,
  ): Promise<ConflictCheckResult> {
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    };
    if (excludeEventId) {
      query._id = { $ne: new Types.ObjectId(excludeEventId) };
    }

    const candidates = await EventModel.find(query).select('_id startTime endTime').lean();

    const conflicting = candidates.filter((c) =>
      rangesOverlap(startTime, endTime, c.startTime, c.endTime),
    );

    return {
      hasConflict: conflicting.length > 0,
      conflictingEventIds: conflicting.map((c) => c._id.toString()),
    };
  }

  async createEvent(input: CreateEventInput): Promise<IEvent> {
    if (input.endTime <= input.startTime) {
      throw new AppError('VALIDATION_ERROR', 400, 'endTime must be after startTime');
    }

    if (!input.force) {
      const conflictResult = await this.checkConflicts(input.userId, input.startTime, input.endTime);
      if (conflictResult.hasConflict) {
        throw new AppError('CONFLICT_DETECTED', 409, 'Event overlaps existing event(s)', {
          conflictingEventIds: conflictResult.conflictingEventIds,
        });
      }
    }

    const event = await EventModel.create({
      userId: new Types.ObjectId(input.userId),
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      source: input.source ?? 'manual',
      sourceContestId: input.sourceContestId ? new Types.ObjectId(input.sourceContestId) : undefined,
      recurrence: input.recurrence,
      aiReasoning: input.aiReasoning,
      noteId: input.noteId ? new Types.ObjectId(input.noteId) : undefined,
    });

    return event;
  }

  /**
   * Expands a recurring event's rule into concrete occurrence instances within
   * a given [rangeStart, rangeEnd) window, for calendar rendering. Does NOT
   * persist expanded instances — they're computed on read, keeping the base
   * Event document as the single source of truth for the rule itself.
   */
  expandRecurrence(event: IEvent, rangeStart: Date, rangeEnd: Date): { startTime: Date; endTime: Date }[] {
    if (!event.recurrence) {
      return rangesOverlap(event.startTime, event.endTime, rangeStart, rangeEnd)
        ? [{ startTime: event.startTime, endTime: event.endTime }]
        : [];
    }

    const { freq, interval, byDay, until } = event.recurrence;
    const durationMs = event.endTime.getTime() - event.startTime.getTime();
    const occurrences: { startTime: Date; endTime: Date }[] = [];

    const seriesStart = DateTime.fromJSDate(event.startTime, { zone: 'utc' });
    const windowEnd = DateTime.fromJSDate(rangeEnd, { zone: 'utc' });
    const seriesEnd = until ? DateTime.fromJSDate(until, { zone: 'utc' }) : windowEnd;
    const effectiveEnd = seriesEnd < windowEnd ? seriesEnd : windowEnd;

    if (freq === 'daily') {
      let cursor = seriesStart;
      while (cursor <= effectiveEnd) {
        this.pushIfInRange(cursor, durationMs, rangeStart, rangeEnd, occurrences);
        cursor = cursor.plus({ days: interval });
      }
    } else if (freq === 'weekly') {
      const targetDays = byDay?.length
        ? byDay.map((d) => WEEKDAY_MAP[d]).filter((d): d is number => d !== undefined)
        : [seriesStart.weekday];

      let weekCursor = seriesStart.startOf('week');
      while (weekCursor <= effectiveEnd) {
        for (const weekday of targetDays) {
          const occurrence = weekCursor.set({ weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7 }).set({
            hour: seriesStart.hour,
            minute: seriesStart.minute,
            second: seriesStart.second,
          });
          if (occurrence >= seriesStart && occurrence <= effectiveEnd) {
            this.pushIfInRange(occurrence, durationMs, rangeStart, rangeEnd, occurrences);
          }
        }
        weekCursor = weekCursor.plus({ weeks: interval });
      }
    } else {
      // 'custom' recurrence: fall back to treating as a single occurrence.
      // Extend here with RRULE parsing (e.g. via the `rrule` package) if
      // custom recurrence needs full RFC 5545 support in a later iteration.
      if (rangesOverlap(event.startTime, event.endTime, rangeStart, rangeEnd)) {
        occurrences.push({ startTime: event.startTime, endTime: event.endTime });
      }
    }

    return occurrences;
  }

  private pushIfInRange(
    occurrenceStart: DateTime,
    durationMs: number,
    rangeStart: Date,
    rangeEnd: Date,
    out: { startTime: Date; endTime: Date }[],
  ): void {
    const start = occurrenceStart.toJSDate();
    const end = new Date(start.getTime() + durationMs);
    if (rangesOverlap(start, end, rangeStart, rangeEnd)) {
      out.push({ startTime: start, endTime: end });
    }
  }

  async getEventsInRange(userId: string, from: Date, to: Date): Promise<IEvent[]> {
    return EventModel.find({
      userId: new Types.ObjectId(userId),
      startTime: { $lt: to },
      endTime: { $gt: from },
    })
      .sort({ startTime: 1 })
      .exec();
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const event = await EventModel.findById(eventId);
    if (!event) {
      throw new AppError('NOT_FOUND', 404, 'Event not found');
    }
    if (event.userId.toString() !== userId) {
      throw new AppError('NOT_OWNER', 403, 'You do not own this event');
    }
    await event.deleteOne();
  }
}

export const eventService = new EventService();
