import React, { useMemo, useCallback, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enIN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEventsQuery } from '../../queries/useEventsQuery';
import { EventChip } from './EventChip';
import { EventDto } from '../../types/shared';

export interface CalendarEventVM {
  id: string;
  title: string;
  start: Date;
  end: Date;
  source: EventDto['source'];
  aiReasoning?: string;
}

const locales = { 'en-IN': enIN };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const SOURCE_COLOR: Record<CalendarEventVM['source'], string> = {
  manual: '#9AA3B2',
  'ai-ashna': '#7C5CFC',
  'ai-custom': '#2DD4BF',
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

  // Previously this component had its own inline fetchEvents + useQuery
  // duplicating exactly what useEventsQuery already does — now delegates
  // to the shared hook so query-key/staleTime behavior stays centralized.
  const { data: eventDtos = [], isLoading } = useEventsQuery({ from: range.from, to: range.to });
  const events = useMemo(() => eventDtos.map(toVM), [eventDtos]);

  const eventStyleGetter = useCallback(
    (event: CalendarEventVM) => ({
      style: {
        backgroundColor: SOURCE_COLOR[event.source],
        borderRadius: '6px',
        border: 'none',
        color: '#0B0F19',
        fontSize: '12px',
      },
    }),
    [],
  );

  const handleRangeChange = useCallback((newRange: Date[] | { start: Date; end: Date }) => {
    if (Array.isArray(newRange)) {
      setRange({ from: newRange[0].toISOString(), to: newRange[newRange.length - 1].toISOString() });
    } else {
      setRange({ from: newRange.start.toISOString(), to: newRange.end.toISOString() });
    }
  }, []);

  const components = useMemo(
    () => ({
      // Previously an inline render function duplicating EventChip's logic —
      // now renders the actual extracted component.
      event: ({ event }: { event: CalendarEventVM }) => <EventChip event={event} />,
    }),
    [],
  );

  return (
    <div style={{ height: '100%', minHeight: '600px', position: 'relative' }}>
      {isLoading && (
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
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        eventPropGetter={eventStyleGetter}
        components={components}
        culture="en-IN"
        style={{ height: '100%' }}
      />
    </div>
  );
}

export default CalendarGrid;