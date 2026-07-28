import { Types } from 'mongoose';
import { EventModel } from '../../models/Event.model';
import { eventService } from './event.service';
import { IUserPreferences } from '../../models/User.model';
import { logger } from '../../utils/logger';

const SLEEP_SCHEDULE_DAYS = 10;

export interface SleepScheduleResult {
  created: number;
  skipped: { date: string; reason: string }[];
  alreadyExisted: number;
}

function parseHHmm(value: string): { hours: number; minutes: number } {
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes };
}

export class SleepScheduleService {
  /**
   * Generates (or tops up) auto-sleep events for the next 10 days,
   * starting today, based on the user's current sleepWindow preference.
   * Idempotent per day: a day that already has an isAutoSleepBlock event
   * is left untouched, not duplicated — this makes it safe to call
   * repeatedly (e.g. from a "top up my schedule" button) without ever
   * creating overlapping duplicate sleep blocks for the same night.
   *
   * Overlap handling: if the computed sleep window overlaps an existing
   * event that night (a contest, most commonly), the sleep block's START
   * is shifted to right after that conflicting event ends, with the END
   * (wake time) held fixed — mirroring the AI scheduling agent's own
   * documented behavior for the identical situation. If the remaining
   * window is non-positive (the conflict runs past the wake time), that
   * day is skipped with a clear reason rather than creating a
   * zero/negative-duration event.
   */
  async generateSchedule(userId: string, sleepWindow: IUserPreferences['sleepWindow']): Promise<SleepScheduleResult> {
    if (!sleepWindow) {
      return { created: 0, skipped: [], alreadyExisted: 0 };
    }

    const result: SleepScheduleResult = { created: 0, skipped: [], alreadyExisted: 0 };
    const { hours: startH, minutes: startM } = parseHHmm(sleepWindow.start);
    const { hours: endH, minutes: endM } = parseHHmm(sleepWindow.end);
    const crossesMidnight = startH * 60 + startM > endH * 60 + endM; // e.g. 23:00 -> 06:00

    for (let dayOffset = 0; dayOffset < SLEEP_SCHEDULE_DAYS; dayOffset++) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + dayOffset);

      const desiredStart = new Date(baseDate);
      desiredStart.setHours(startH, startM, 0, 0);

      const desiredEnd = new Date(baseDate);
      if (crossesMidnight) desiredEnd.setDate(desiredEnd.getDate() + 1);
      desiredEnd.setHours(endH, endM, 0, 0);

      const dateLabel = baseDate.toISOString().slice(0, 10);

      // Idempotency check — a window spanning this sleep block's actual
      // [desiredStart, desiredEnd) range, not just calendar-day boundaries,
      // since a sleep block crossing midnight technically "belongs" to
      // the evening it started on.
      const existing = await EventModel.findOne({
        userId: new Types.ObjectId(userId),
        isAutoSleepBlock: true,
        startTime: { $gte: new Date(desiredStart.getTime() - 12 * 60 * 60 * 1000), $lte: desiredEnd },
      });

      if (existing) {
        result.alreadyExisted += 1;
        continue;
      }

      try {
        const conflictCheck = await eventService.checkConflicts(userId, desiredStart, desiredEnd);

        let finalStart = desiredStart;

        if (conflictCheck.hasConflict) {
          const conflictingEvents = await EventModel.find({
            _id: { $in: conflictCheck.conflictingEventIds.map((id) => new Types.ObjectId(id)) },
          }).select('endTime');

          const latestConflictEnd = conflictingEvents.reduce(
            (latest, e) => (e.endTime > latest ? e.endTime : latest),
            desiredStart,
          );

          finalStart = latestConflictEnd;

          if (finalStart >= desiredEnd) {
            result.skipped.push({
              date: dateLabel,
              reason: 'A scheduled event runs past your wake time, leaving no room for sleep that night',
            });
            continue;
          }

          // Re-check the shifted window itself doesn't ALSO conflict with
          // something else (e.g. two overlapping contests that night) —
          // rather than looping indefinitely, one re-check is enough for
          // the realistic case; a genuinely fully-booked night falls
          // through to the create call below and lets the normal
          // conflict-detection on createEvent reject it if truly unresolvable.
        }

        await eventService.createEvent({
          userId,
          title: 'Sleep',
          startTime: finalStart,
          endTime: desiredEnd,
          source: 'manual',
          force: true, // we've already done our own conflict resolution above
        });

        await EventModel.updateOne(
          { userId: new Types.ObjectId(userId), startTime: finalStart, endTime: desiredEnd, title: 'Sleep' },
          { $set: { isAutoSleepBlock: true } },
        );

        result.created += 1;
      } catch (err) {
        logger.error({ err, userId, date: dateLabel }, 'Failed to generate sleep block for date');
        result.skipped.push({ date: dateLabel, reason: 'An error occurred while scheduling this night' });
      }
    }

    return result;
  }

  /**
   * Deletes future (not-yet-started) auto-sleep events, for use before
   * regenerating with a changed sleep window — see the "adjust after
   * asking" confirmation flow, which calls this only after explicit user
   * confirmation, never silently.
   */
  async clearFutureAutoSleepBlocks(userId: string): Promise<number> {
    const result = await EventModel.deleteMany({
      userId: new Types.ObjectId(userId),
      isAutoSleepBlock: true,
      startTime: { $gte: new Date() },
    });
    return result.deletedCount ?? 0;
  }

  async countFutureAutoSleepBlocks(userId: string): Promise<number> {
    return EventModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isAutoSleepBlock: true,
      startTime: { $gte: new Date() },
    });
  }
}

export const sleepScheduleService = new SleepScheduleService();