import { useMemo, useCallback, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enIN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEventsQuery } from '../../queries/useEventsQuery';
import { useGoogleCalendarRangeQuery } from '../../queries/useGoogleCalendarRangeQuery';
import { EventChip } from './EventChip';
import { EventDto } from '../../types/shared';

export type CalendarEventSource = EventDto['source'] | 'google-calendar';

export interface CalendarEventVM {
  id: string;
  title: string;
  start: Date;
  end: Date;
  source: CalendarEventSource;
  aiReasoning?: string;
  /** True only for Google-only events with no corresponding local Event
   *  document — used to hide delete/edit affordances, since we don't own
   *  this data. */
  isExternal?: boolean;
}

const locales = { 'en-IN': enIN };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const SOURCE_COLOR: Record<CalendarEventSource, { text: string; border: string; bg: string }> = {
  manual: {
    text: 'var(--color-text-primary)',
    border: 'var(--color-border-subtle)',
    bg: 'var(--color-bg-elevated)',
  },
  'ai-ashna': {
    text: 'var(--color-accent-ashna)',
    border: 'var(--color-accent-ashna)',
    bg: 'var(--color-accent-ashna-tint)',
  },
  'ai-custom': {
    text: 'var(--color-accent-custom)',
    border: 'var(--color-accent-custom)',
    bg: 'var(--color-accent-custom-tint)',
  },
  'google-calendar': {
    text: 'var(--color-success)',
    border: 'var(--color-success)',
    bg: 'var(--color-success-tint)',
  },
};

interface CalendarGridProps {
  onSelectEvent?: (event: CalendarEventVM) => void;
  onSelectSlot?: (slot: SlotInfo) => void;
}

function toVM(dto: EventDto): CalendarEventVM {
  return {
    id: dto._id,
    title: dto.title,
    start: new Date(dto.startTime),
    end: new Date(dto.endTime),
    source: dto.source,
    aiReasoning: dto.aiReasoning,
  };
}

export function CalendarGrid({ onSelectEvent, onSelectSlot }: CalendarGridProps) {
  const [view, setView] = useState<View>('week');
  const [range, setRange] = useState<{ from: string; to: string }>(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: from.toISOString(), to: to.toISOString() };
  });

  const { data: eventDtos = [], isLoading: isLoadingLocal } = useEventsQuery({ from: range.from, to: range.to });
  const { data: googleData, isLoading: isLoadingGoogle } = useGoogleCalendarRangeQuery(range.from, range.to);

  const events = useMemo(() => {
    const localEvents = eventDtos.map(toVM);

    // Google events are matched against local events by googleCalendarEventId
    // (set on our own Event documents once pushed — see googleCalendar.sync.ts's
    // pushEvent). Any local event already has its own entry above; only Google
    // events with NO corresponding local record are added as external/read-only,
    // so a CP Calendar Pro event that's ALSO synced to Google never renders twice.
    const localGoogleIds = new Set(
      eventDtos.filter((e) => e.googleCalendarEventId).map((e) => e.googleCalendarEventId as string),
    );

    const externalGoogleEvents: CalendarEventVM[] = (googleData?.events ?? [])
      .filter((ge) => !localGoogleIds.has(ge.googleEventId))
      .map((ge) => ({
        id: `google:${ge.googleEventId}`,
        title: ge.title,
        start: new Date(ge.startTime),
        end: new Date(ge.endTime),
        source: 'google-calendar' as const,
        isExternal: true,
      }));

    return [...localEvents, ...externalGoogleEvents];
  }, [eventDtos, googleData]);

  const eventStyleGetter = useCallback((event: CalendarEventVM) => {
    const palette = SOURCE_COLOR[event.source];
    return {
      style: {
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderLeft: `3px solid ${palette.border}`,
        borderRadius: 'var(--radius-sm)',
        color: palette.text,
        fontSize: '12px',
        fontWeight: 600,
      },
    };
  }, []);

  const handleRangeChange = useCallback((newRange: Date[] | { start: Date; end: Date }) => {
    // Day view fires onRangeChange with a single-element array (just
    // [today]) rather than {start, end} OR a multi-day array — the
    // previous logic did `newRange[newRange.length - 1]` for the "to"
    // bound, which for a 1-element array resolves to the SAME instant as
    // "from". That produces a [today 00:00, today 00:00) range — a
    // zero-width window — so the events query correctly returns nothing,
    // because nothing genuinely falls inside a zero-duration range. This
    // is exactly why events silently vanished specifically in Day view.
    // Fix: when we get a single-date array, expand it to that full day's
    // [00:00, 23:59:59.999] bounds instead of treating it as both edges
    // of an empty window.
    if (Array.isArray(newRange)) {
      const from = newRange[0];
      const lastDate = newRange[newRange.length - 1];

      if (newRange.length === 1) {
        const dayStart = new Date(from);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(from);
        dayEnd.setHours(23, 59, 59, 999);
        setRange({ from: dayStart.toISOString(), to: dayEnd.toISOString() });
        return;
      }

      setRange({ from: from.toISOString(), to: lastDate.toISOString() });
    } else {
      setRange({ from: newRange.start.toISOString(), to: newRange.end.toISOString() });
    }
  }, []);

  const components = useMemo(
    () => ({
      event: ({ event }: { event: CalendarEventVM }) => <EventChip event={event} />,
    }),
    [],
  );

  const handleSelectEvent = useCallback(
    (event: CalendarEventVM) => {
      onSelectEvent?.(event);
    },
    [onSelectEvent],
  );

  return (
    <div className="rbc-responsive-wrapper" style={{ height: '100%', minHeight: '480px', position: 'relative' }}>
      {(isLoadingLocal || isLoadingGoogle) && (
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          Loading…
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        onRangeChange={handleRangeChange}
        selectable
        onSelectEvent={handleSelectEvent}
        onSelectSlot={onSelectSlot}
        eventPropGetter={eventStyleGetter}
        components={components}
        culture="en-IN"
        style={{ height: '100%' }}
        popup
      />
    </div>
  );
}

export default CalendarGrid;