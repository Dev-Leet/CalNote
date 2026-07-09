import React, { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enIN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

export interface CalendarEventVM {
  id: string;
  title: string;
  start: Date;
  end: Date;
  source: 'manual' | 'ai-ashna' | 'ai-custom';
  aiReasoning?: string;
}

interface RawEventDto {
  _id: string;
  title: string;
  startTime: string; // IST ISO string from API
  endTime: string;
  source: 'manual' | 'ai-ashna' | 'ai-custom';
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

async function fetchEvents(from: Date, to: Date): Promise<CalendarEventVM[]> {
  const { data } = await apiClient.get<{ events: RawEventDto[] }>('/events', {
    params: { from: from.toISOString(), to: to.toISOString() },
  });

  return data.events.map((e) => ({
    id: e._id,
    title: e.title,
    start: new Date(e.startTime),
    end: new Date(e.endTime),
    source: e.source,
    aiReasoning: e.aiReasoning,
  }));
}

export function CalendarGrid({ onSelectEvent, onSelectSlot }: CalendarGridProps) {
  const [view, setView] = React.useState<View>('week');
  const [range, setRange] = React.useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchEvents(range.from, range.to),
    staleTime: 60_000,
  });

  const eventStyleGetter = useCallback((event: CalendarEventVM) => {
    return {
      style: {
        backgroundColor: SOURCE_COLOR[event.source],
        borderRadius: '6px',
        border: 'none',
        color: event.source === 'manual' ? '#0B0F19' : '#0B0F19',
        fontSize: '12px',
      },
    };
  }, []);

  const handleRangeChange = useCallback((newRange: Date[] | { start: Date; end: Date }) => {
    if (Array.isArray(newRange)) {
      setRange({ from: newRange[0], to: newRange[newRange.length - 1] });
    } else {
      setRange({ from: newRange.start, to: newRange.end });
    }
  }, []);

  const components = useMemo(
    () => ({
      event: ({ event }: { event: CalendarEventVM }) => (
        <div title={event.aiReasoning ?? event.title}>
          {event.source !== 'manual' && <span aria-hidden="true">✨ </span>}
          {event.title}
        </div>
      ),
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
