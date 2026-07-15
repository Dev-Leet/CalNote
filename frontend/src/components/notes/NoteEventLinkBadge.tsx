
import { Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NoteEventLinkBadgeProps {
  eventId: string;
  eventTitle?: string;
}

export function NoteEventLinkBadge({ eventId, eventTitle }: NoteEventLinkBadgeProps) {
  return (
    <Link
      to={`/calendar?eventId=${eventId}`}
      className="inline-flex items-center gap-1 rounded-pill bg-bg-elevated px-2.5 py-1 text-[11px] text-accent-ashna no-underline"
    >
      <LinkIcon size={11} aria-hidden="true" />
      {eventTitle ?? 'Linked event'}
    </Link>
  );
}

export default NoteEventLinkBadge;