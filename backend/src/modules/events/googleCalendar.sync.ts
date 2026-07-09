import { calendar_v3 } from 'googleapis';
import { getAuthorizedCalendarClient } from '../../config/google';
import { IEvent } from '../../models/Event.model';
import { IUser } from '../../models/User.model';
import { EventModel } from '../../models/Event.model';
import { logger } from '../../utils/logger';

const CALENDAR_ID = 'primary';

/**
 * Converts an internal Event document into a Google Calendar event body.
 *
 * Per SRS constraint 3.4.4: CP Calendar Pro's native UI stays IST-fixed, but
 * the *synced copy* on Google Calendar should respect the user's own Google
 * account timezone. We satisfy both by sending the absolute instant (RFC3339
 * with an explicit UTC offset) rather than a floating local time — Google
 * Calendar always displays an absolute instant in the viewer's own calendar
 * timezone setting, regardless of what offset the instant was authored with.
 * We do NOT set a floating `timeZone` override, which is what would force
 * IST display on the Google side and violate 3.4.4.
 */
function toGoogleEventBody(event: IEvent): calendar_v3.Schema$Event {
  return {
    summary: event.title,
    description: event.aiReasoning
      ? `AI reasoning (CP Calendar Pro): ${event.aiReasoning}`
      : undefined,
    start: { dateTime: event.startTime.toISOString() },
    end: { dateTime: event.endTime.toISOString() },
    recurrence: event.recurrence ? [buildRRuleString(event.recurrence)] : undefined,
    extendedProperties: {
      private: {
        cpCalendarProEventId: event._id.toString(),
        cpCalendarProSource: event.source,
      },
    },
  };
}

function buildRRuleString(recurrence: NonNullable<IEvent['recurrence']>): string {
  const freqMap: Record<string, string> = { daily: 'DAILY', weekly: 'WEEKLY', custom: 'DAILY' };
  const parts = [`FREQ=${freqMap[recurrence.freq]}`, `INTERVAL=${recurrence.interval}`];
  if (recurrence.byDay?.length) {
    parts.push(`BYDAY=${recurrence.byDay.join(',')}`);
  }
  if (recurrence.until) {
    const untilStr = recurrence.until.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    parts.push(`UNTIL=${untilStr}`);
  }
  return `RRULE:${parts.join(';')}`;
}

export class GoogleCalendarSyncService {
  /**
   * Creates or updates the Google Calendar copy of an event. Idempotent:
   * if event.googleCalendarEventId already exists, performs an update instead
   * of creating a duplicate.
   */
  async pushEvent(event: IEvent, user: IUser): Promise<string | null> {
    if (!user.googleRefreshToken) {
      // User hasn't linked Google Calendar — not an error, just a no-op (FR-4.3 is opt-in).
      return null;
    }

    try {
      const calendar = getAuthorizedCalendarClient(user.googleRefreshToken);
      const body = toGoogleEventBody(event);

      if (event.googleCalendarEventId) {
        const res = await calendar.events.update({
          calendarId: CALENDAR_ID,
          eventId: event.googleCalendarEventId,
          requestBody: body,
        });
        return res.data.id ?? null;
      }

      const res = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: body,
      });

      if (res.data.id) {
        await EventModel.updateOne({ _id: event._id }, { $set: { googleCalendarEventId: res.data.id } });
      }

      return res.data.id ?? null;
    } catch (err) {
      // GCal sync failures must not block the core event-creation flow
      // (NFR-2 graceful degradation) — log and continue.
      logger.error({ err, eventId: event._id.toString(), userId: user._id.toString() }, 'Google Calendar sync failed');
      return null;
    }
  }

  async deleteEvent(event: IEvent, user: IUser): Promise<void> {
    if (!user.googleRefreshToken || !event.googleCalendarEventId) {
      return;
    }

    try {
      const calendar = getAuthorizedCalendarClient(user.googleRefreshToken);
      await calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: event.googleCalendarEventId,
      });
    } catch (err) {
      logger.error(
        { err, eventId: event._id.toString(), userId: user._id.toString() },
        'Google Calendar deletion failed',
      );
    }
  }

  /**
   * Exchanges an OAuth authorization code for tokens and stores the refresh
   * token on the user document. Called from the /auth/google/callback route
   * (not generated in this phase — this is the service-layer half only).
   */
  async linkAccount(userId: string, refreshToken: string): Promise<void> {
    const { UserModel } = await import('../../models/User.model');
    await UserModel.updateOne({ _id: userId }, { $set: { googleRefreshToken: refreshToken } });
  }

  async unlinkAccount(userId: string): Promise<void> {
    const { UserModel } = await import('../../models/User.model');
    await UserModel.updateOne({ _id: userId }, { $unset: { googleRefreshToken: '' } });
  }
}

export const googleCalendarSyncService = new GoogleCalendarSyncService();
