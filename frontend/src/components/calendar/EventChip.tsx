
import { Sparkles } from 'lucide-react';
import type { CalendarEventVM } from './CalendarGrid';
import { truncate } from '../../utils/formatters';

interface EventChipProps {
  event: CalendarEventVM;
  maxTitleLength?: number;
}

export function EventChip({ event, maxTitleLength = 40 }: EventChipProps) {
  const isAiSourced = event.source !== 'manual';

  return (
    <div title={event.aiReasoning ?? event.title} className="flex items-center gap-1 text-xs">
      {isAiSourced && <Sparkles size={11} aria-hidden="true" />}
      <span>{truncate(event.title, maxTitleLength)}</span>
    </div>
  );
}

export default EventChip;