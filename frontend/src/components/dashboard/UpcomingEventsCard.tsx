import React from 'react';
import { Calendar } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatEventRange } from '../../utils/formatters';
import { EventDto } from '../../types/shared';

const SOURCE_DOT: Record<EventDto['source'], string> = {
  manual: 'bg-text-secondary',
  'ai-ashna': 'bg-accent-ashna',
  'ai-custom': 'bg-accent-custom',
};

interface UpcomingEventsCardProps {
  events: EventDto[];
  isLoading: boolean;
}

export function UpcomingEventsCard({ events, isLoading }: UpcomingEventsCardProps) {
  return (
    <DashboardCard title="Upcoming This Week" icon={Calendar} viewAllHref="/calendar" viewAllLabel="Open calendar">
      {isLoading && <LoadingSpinner label="Loading events…" />}

      {!isLoading && events.length === 0 && (
        <EmptyState icon={Calendar} title="Nothing scheduled" description="Your week is clear — ask the AI to plan something." />
      )}

      <div className="flex flex-col gap-2">
        {events.map((event) => (
          <div key={event._id} className="flex items-center gap-2.5 rounded-md bg-bg-elevated px-3 py-2.5">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${SOURCE_DOT[event.source]}`} />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[13px] font-medium text-text-primary">{event.title}</p>
              <p className="m-0 text-[11px] text-text-secondary">{formatEventRange(event.startTime, event.endTime)}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export default UpcomingEventsCard;