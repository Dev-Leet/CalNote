import { Types } from 'mongoose';
import { RRule, rrulestr, Weekday } from 'rrule';
import { EventModel, IEvent, IRecurrenceRule } from '../../models/Event.model';
import { UserModel } from '../../models/User.model';
import { googleCalendarSyncService } from './googleCalendar.sync';
import { AppError } from '../../utils/AppError';
import { rangesOverlap } from '../../utils/timezone';
import { logger } from '../../utils/logger';

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
  force?: boolean;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingEventIds: string[];
}

const BYDAY_TO_RRULE_WEEKDAY: Record<string, Weekday> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

export class EventService {
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

    void this.syncToGoogleCalendarIfLinked(event);

    return event;
  }

  async syncToGoogleCalendarIfLinked(event: IEvent): Promise<void> {
    try {
      const user = await UserModel.findById(event.userId).select('+googleRefreshToken');
      if (!user || !user.googleRefreshToken) return;
      await googleCalendarSyncService.pushEvent(event, user);
    } catch (err) {
      logger.error({ err, eventId: event._id.toString() }, 'GCal sync wrapper failed');
    }
  }

  private async cleanupGoogleCalendarIfLinked(event: IEvent): Promise<void> {
    try {
      if (!event.googleCalendarEventId) return;
      const user = await UserModel.findById(event.userId).select('+googleRefreshToken');
      if (!user || !user.googleRefreshToken) return;
      await googleCalendarSyncService.deleteEvent(event, user);
    } catch (err) {
      logger.error({ err, eventId: event._id.toString() }, 'GCal cleanup wrapper failed');
    }
  }

  /**
   * Expands a recurring event's rule into concrete occurrence instances within
   * [rangeStart, rangeEnd), for calendar rendering. Computed on read — never
   * persisted — keeping the base Event document as the single source of truth
   * for the rule itself.
   *
   * Backed by the `rrule` library for all three freq values (previously only
   * daily/weekly had a working hand-rolled implementation; 'custom' silently
   * fell back to a single occurrence with no real recurrence expressed).
   */
  expandRecurrence(event: IEvent, rangeStart: Date, rangeEnd: Date): { startTime: Date; endTime: Date }[] {
    if (!event.recurrence) {
      return rangesOverlap(event.startTime, event.endTime, rangeStart, rangeEnd)
        ? [{ startTime: event.startTime, endTime: event.endTime }]
        : [];
    }

    const durationMs = event.endTime.getTime() - event.startTime.getTime();
    const rule = this.buildRRule(event);

    if (!rule) {
      // 'custom' freq with no rruleString — the create/update validation
      // schema now requires one, so this should only happen for legacy data
      // created before that constraint existed. Falls back to a single
      // occurrence, same as before, but now explicitly logged rather than
      // silently done, since it genuinely means "we don't know what this
      // recurrence is supposed to be."
      logger.warn(
        { eventId: event._id.toString() },
        "Custom recurrence has no rruleString — expanding as a single occurrence",
      );
      return rangesOverlap(event.startTime, event.endTime, rangeStart, rangeEnd)
        ? [{ startTime: event.startTime, endTime: event.endTime }]
        : [];
    }

    // Query with the lower bound pulled back by one event-duration, so an
    // occurrence that STARTS before rangeStart but still OVERLAPS into it
    // (e.g. an overnight block spanning a day-range boundary) isn't missed —
    // rrule's .between() only matches on occurrence start time, not full
    // [start, end) overlap, so this widen-then-filter step restores parity
    // with the overlap semantics the rest of the app relies on.
    const searchStart = new Date(rangeStart.getTime() - durationMs);
    const occurrenceStarts = rule.between(searchStart, rangeEnd, true);

    return occurrenceStarts
      .map((start) => ({ startTime: start, endTime: new Date(start.getTime() + durationMs) }))
      .filter((o) => rangesOverlap(o.startTime, o.endTime, rangeStart, rangeEnd));
  }

  /**
   * Builds an RRule instance anchored to the event's own startTime as
   * DTSTART. Returns null only when freq is 'custom' with no rruleString —
   * every other case, including 'custom' WITH an rruleString, is fully
   * expressible via the rrule library (monthly, yearly, BYSETPOS, etc. —
   * anything RFC 5545 supports, not just what daily/weekly can represent).
   */
  private buildRRule(event: IEvent): RRule | null {
    const { freq, interval, byDay, until, rruleString } = event.recurrence!;

    if (freq === 'custom') {
      if (!rruleString) return null;
      try {
        const parsed = rrulestr(rruleString, { dtstart: event.startTime });
        return parsed instanceof RRule ? parsed : parsed.rrules()[0] ?? null;
      } catch (err) {
        logger.error({ err, eventId: event._id.toString(), rruleString }, 'Failed to parse custom rruleString');
        return null;
      }
    }

    return new RRule({
      freq: freq === 'daily' ? RRule.DAILY : RRule.WEEKLY,
      interval,
      dtstart: event.startTime,
      until: until ?? null,
      byweekday: byDay?.length
        ? byDay.map((d) => BYDAY_TO_RRULE_WEEKDAY[d]).filter((d): d is Weekday => !!d)
        : undefined,
    });
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

    void this.cleanupGoogleCalendarIfLinked(event);

    await event.deleteOne();
  }
}

export const eventService = new EventService();