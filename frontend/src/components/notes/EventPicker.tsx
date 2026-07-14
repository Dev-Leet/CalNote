import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Search, X } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatEventRange } from '../../utils/formatters';
import { EventDto } from '../../types/shared';

interface EventPickerProps {
  onSelect: (event: EventDto) => void;
  onCancel: () => void;
}

/**
 * Lets a user explicitly choose which event a new note is about, replacing
 * the previous auto-attach-on-AI-schedule behavior. Queries a generous
 * rolling window (past 30d -> future 90d) since a user might want to
 * reflect on a recent past contest as easily as an upcoming one.
 */
export function EventPicker({ onSelect, onCancel }: EventPickerProps) {
  const [search, setSearch] = useState('');

  const { from, to } = useMemo(() => {
    const now = new Date();
    return {
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', from, to, 'all'],
    queryFn: () => eventsApi.list(from, to),
  });

  const filtered = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    if (!search.trim()) return sorted;
    return sorted.filter((e) => e.title.toLowerCase().includes(search.trim().toLowerCase()));
  }, [events, search]);

  return (
    <div className="flex h-full flex-col rounded-md bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="m-0 text-sm font-semibold text-text-primary">Select an event to write about</h3>
        <button type="button" onClick={onCancel} aria-label="Cancel" className="text-text-secondary">
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <Search size={14} className="text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events by title…"
          className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-secondary"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading && <LoadingSpinner label="Loading events…" />}

        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={Calendar} title="No matching events" description="Try a different search, or create an event on the calendar first." />
        )}

        <div className="flex flex-col gap-1.5">
          {filtered.map((event) => (
            <button
              key={event._id}
              type="button"
              onClick={() => onSelect(event)}
              className="rounded-md bg-bg-elevated px-3.5 py-2.5 text-left"
            >
              <p className="m-0 text-[13px] font-medium text-text-primary">{event.title}</p>
              <p className="m-0 mt-0.5 text-[11px] text-text-secondary">{formatEventRange(event.startTime, event.endTime)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventPicker;