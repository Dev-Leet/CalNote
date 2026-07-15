
import { CalendarClock } from 'lucide-react';
import { useGoogleCalendarEventsQuery } from '../../queries/useGoogleCalendarEventsQuery';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { formatEventRange } from '../../utils/formatters';

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
    <div className="flex flex-col gap-2">
      {data.events.map((event) => (
        <div key={event.googleEventId} className="rounded-md bg-bg-elevated px-3 py-2.5">
          <p className="m-0 text-[13px] text-text-primary">{event.title}</p>
          <p className="m-0 mt-1 text-[11px] text-text-secondary">
            {event.isAllDay ? 'All day' : formatEventRange(event.startTime, event.endTime)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default GoogleCalendarPreview;