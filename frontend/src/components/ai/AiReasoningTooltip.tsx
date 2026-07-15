
import { Sparkles } from 'lucide-react';

interface AiReasoningTooltipProps {
  reasoning: string;
  providerLabel?: string;
}

export function AiReasoningTooltip({ reasoning, providerLabel }: AiReasoningTooltipProps) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-bg-elevated px-3.5 py-3">
      <Sparkles size={14} className="mt-0.5 flex-shrink-0 text-accent-ashna" />
      <div>
        {providerLabel && (
          <p className="mb-1 text-[11px] font-bold uppercase text-text-secondary">{providerLabel}</p>
        )}
        <p className="m-0 whitespace-pre-wrap break-words text-[13px] italic text-text-primary">{reasoning}</p>
      </div>
    </div>
  );
}

export default AiReasoningTooltip;