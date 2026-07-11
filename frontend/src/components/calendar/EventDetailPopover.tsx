
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

const SOURCE_COLOR: Record<CalendarEventVM['source'], string> = {
  manual: 'var(--color-text-secondary)',
  'ai-ashna': 'var(--color-accent-ashna)',
  'ai-custom': 'var(--color-accent-custom)',
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
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11, 15, 25, 0.6)',
        zIndex: 900,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          padding: '24px',
          borderRadius: '16px',
          background: 'var(--color-bg-surface)',
          borderLeft: `4px solid ${SOURCE_COLOR[event.source]}`,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: SOURCE_COLOR[event.source],
          }}
        >
          {SOURCE_LABEL[event.source]}
        </span>

        <h2 id="event-popover-title" style={{ color: 'var(--color-text-primary)', fontSize: '18px', margin: '6px 0' }}>
          {event.title}
        </h2>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '0 0 12px' }}>
          {event.start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} &ndash;{' '}
          {event.end.toLocaleTimeString('en-IN', { timeStyle: 'short' })} IST
        </p>

        {event.aiReasoning && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--color-bg-elevated)',
              marginBottom: '16px',
            }}
          >
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 4px', fontWeight: 700 }}>
              Why the AI scheduled it here
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', margin: 0, fontStyle: 'italic' }}>
              {event.aiReasoning}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => remove(event.id)}
            disabled={isDeleting}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--color-danger)',
              color: '#0B0F19',
              fontWeight: 600,
              fontSize: '13px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPopover;
