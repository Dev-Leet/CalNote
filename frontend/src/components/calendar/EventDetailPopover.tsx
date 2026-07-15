
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { CalendarEventVM } from './CalendarGrid';

interface EventDetailPopoverProps {
  event: CalendarEventVM | null;
  onClose: () => void;
}

const SOURCE_LABEL: Record<CalendarEventVM['source'], string> = {
  manual: 'Manually created',
  'ai-ashna': 'Scheduled by Ashna AI',
  'ai-custom': 'Scheduled by your Custom AI Agent',
};

// Tailwind can't interpolate arbitrary class names from a template string
// reliably with JIT purging, so these stay as explicit per-source class
// strings rather than a dynamic `border-${x}` — keeps the purge scanner
// able to see every literal class.
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

export function EventDetailPopover({ event, onClose }: EventDetailPopoverProps) {
  const queryClient = useQueryClient();

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  if (!event) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-popover-title"
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-[400px] rounded-lg border-l-4 bg-bg-surface p-6 ${SOURCE_BORDER[event.source]}`}
      >
        <span className={`text-[11px] font-bold uppercase ${SOURCE_TEXT[event.source]}`}>
          {SOURCE_LABEL[event.source]}
        </span>

        <h2 id="event-popover-title" className="my-1.5 text-lg text-text-primary">
          {event.title}
        </h2>

        <p className="mb-3 text-[13px] text-text-secondary">
          {event.start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} &ndash;{' '}
          {event.end.toLocaleTimeString('en-IN', { timeStyle: 'short' })} IST
        </p>

        {event.aiReasoning && (
          <div className="mb-4 rounded-md bg-bg-elevated px-3.5 py-3">
            <p className="mb-1 text-[11px] font-bold uppercase text-text-secondary">
              Why the AI scheduled it here
            </p>
            <p className="m-0 text-[13px] italic text-text-primary">{event.aiReasoning}</p>
          </div>
        )}

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill bg-bg-elevated px-4 py-2 text-[13px] text-text-primary"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => remove(event.id)}
            disabled={isDeleting}
            className={`rounded-pill bg-danger px-4 py-2 text-[13px] font-semibold text-bg-primary ${
              isDeleting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPopover;