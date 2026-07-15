
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, X } from 'lucide-react';
import apiClient from '../../api/client';
import { CalendarEventVM } from './CalendarGrid';
import { EmptyState } from '../common/EmptyState';

interface EventDetailsPanelProps {
  event: CalendarEventVM | null;
  onClose: () => void;
}

const SOURCE_LABEL: Record<CalendarEventVM['source'], string> = {
  manual: 'Manually created',
  'ai-ashna': 'Scheduled by Ashna AI',
  'ai-custom': 'Scheduled by your Custom AI Agent',
};

const SOURCE_BORDER: Record<CalendarEventVM['source'], string> = {
  manual: 'border-l-border-subtle',
  'ai-ashna': 'border-l-accent-ashna',
  'ai-custom': 'border-l-accent-custom',
};

const SOURCE_TEXT: Record<CalendarEventVM['source'], string> = {
  manual: 'text-text-secondary',
  'ai-ashna': 'text-accent-ashna',
  'ai-custom': 'text-accent-custom',
};

async function deleteEvent(eventId: string): Promise<void> {
  await apiClient.delete(`/events/${eventId}`);
}

/**
 * Replaces the previous EventDetailPopover modal entirely — clicking an
 * event now populates this sidebar card instead of opening a centered
 * overlay dialog, per explicit product decision. Sits above AiChatPanel in
 * CalendarPage's sidebar column, matching GoogleCalendarPreview's existing
 * card pattern.
 */
export function EventDetailsPanel({ event, onClose }: EventDetailsPanelProps) {
  const queryClient = useQueryClient();

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  if (!event) {
    return (
      <div className="rounded-lg bg-bg-surface p-4">
        <h3 className="m-0 mb-2.5 text-[13px] font-semibold text-text-primary">Event Details</h3>
        <EmptyState icon={CalendarClock} title="No event selected" description="Click an event on the calendar to see its details here." />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border-l-4 bg-bg-surface ${SOURCE_BORDER[event.source]}`}>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <h3 className="m-0 text-[13px] font-semibold text-text-primary">Event Details</h3>
        <button type="button" onClick={onClose} aria-label="Close" className="text-text-secondary">
          <X size={15} />
        </button>
      </div>

      <div className="p-4">
        <span className={`text-[11px] font-bold uppercase ${SOURCE_TEXT[event.source]}`}>
          {SOURCE_LABEL[event.source]}
        </span>

        <h2 className="my-1.5 text-base text-text-primary">{event.title}</h2>

        <p className="mb-3 text-[13px] text-text-secondary">
          {event.start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} &ndash;{' '}
          {event.end.toLocaleTimeString('en-IN', { timeStyle: 'short' })} IST
        </p>

        {event.aiReasoning && (
          <div className="mb-4 rounded-md bg-bg-elevated px-3.5 py-3">
            <p className="mb-1 text-[11px] font-bold uppercase text-text-secondary">Why the AI scheduled it here</p>
            <p className="m-0 whitespace-pre-wrap break-words text-[13px] italic text-text-primary">
              {event.aiReasoning}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => remove(event.id)}
          disabled={isDeleting}
          className={`w-full rounded-pill bg-danger py-2 text-[13px] font-semibold text-bg-primary ${
            isDeleting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {isDeleting ? 'Deleting…' : 'Delete Event'}
        </button>
      </div>
    </div>
  );
}

export default EventDetailsPanel;