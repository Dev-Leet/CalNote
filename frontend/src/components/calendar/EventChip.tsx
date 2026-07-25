
import { Sparkles, ExternalLink } from 'lucide-react';
import type { CalendarEventVM } from './CalendarGrid';
import { truncate } from '../../utils/formatters';

interface EventChipProps {
  event: CalendarEventVM;
  maxTitleLength?: number;
}

export function EventChip({ event, maxTitleLength = 40 }: EventChipProps) {
  const isAiSourced = event.source === 'ai-ashna' || event.source === 'ai-custom';
  const isGoogle = event.source === 'google-calendar';

  return (
    <div
      title={isGoogle ? `${event.title} (from Google Calendar)` : event.aiReasoning ?? event.title}
      className="flex items-center gap-1 text-xs"
    >
      {isAiSourced && <Sparkles size={11} aria-hidden="true" />}
      {isGoogle && <ExternalLink size={11} aria-hidden="true" />}
      <span>{truncate(event.title, maxTitleLength)}</span>
    </div>
  );
}

export default EventChip;