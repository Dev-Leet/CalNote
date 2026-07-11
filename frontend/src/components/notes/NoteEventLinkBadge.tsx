
import { Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
 
interface NoteEventLinkBadgeProps {
  eventId: string;
  eventTitle?: string;
}

/**
 * Shows and links to the parent event for notes attached via eventId,
 * referenced in Section 7.6's component breakdown but never built.
 * Intended for use inside NoteEditor / NotesList item rendering.
 */
export function NoteEventLinkBadge({ eventId, eventTitle }: NoteEventLinkBadgeProps) {
  return (
    <Link
      to={`/calendar?eventId=${eventId}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '9999px',
        background: 'var(--color-bg-elevated)',
        color: 'var(--color-accent-ashna)',
        fontSize: '11px',
        textDecoration: 'none',
      }}
    >
      <LinkIcon size={11} aria-hidden="true" />
      {eventTitle ?? 'Linked event'}
    </Link>
  );
}

export default NoteEventLinkBadge;
