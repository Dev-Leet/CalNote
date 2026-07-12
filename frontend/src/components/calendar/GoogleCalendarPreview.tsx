
import { CalendarClock } from 'lucide-react';
import { useGoogleCalendarEventsQuery } from '../../queries/useGoogleCalendarEventsQuery';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { formatEventRange } from '../../utils/formatters';

/**
 * Small read-only widget listing upcoming events pulled directly from the
 * user's linked Google Calendar — the "pull" counterpart to the existing
 * push-only sync. Not meant to duplicate the main CalendarGrid; this is a
 * lightweight sidebar/dashboard reference so users can see what's on Google
 * without leaving the app.
 */
export function GoogleCalendarPreview() {
  const { data, isLoading } = useGoogleCalendarEventsQuery();

  if (isLoading) return <LoadingSpinner size={16} label="Loading Google Calendar…" />;

  if (!data?.linked) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Google Calendar not linked"
        description="Link your Google account in Settings to see your events here."
      />
    );
  }

  if (data.events.length === 0) {
    return <EmptyState icon={CalendarClock} title="No upcoming Google Calendar events" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.events.map((event) => (
        <div
          key={event.googleEventId}
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--color-bg-elevated)',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-primary)' }}>{event.title}</p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            {event.isAllDay ? 'All day' : formatEventRange(event.startTime, event.endTime)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default GoogleCalendarPreview;