
import { Sparkles } from 'lucide-react';
 
interface AiReasoningTooltipProps {
  reasoning: string;
  providerLabel?: string;
}

export function AiReasoningTooltip({ reasoning, providerLabel }: AiReasoningTooltipProps) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '10px',
        background: 'var(--color-bg-elevated)',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
      }}
    >
      <Sparkles size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--color-accent-ashna)' }} aria-hidden="true" />
      <div>
        {providerLabel && (
          <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 4px', fontWeight: 700 }}>
            {providerLabel}
          </p>
        )}
        <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', margin: 0, fontStyle: 'italic' }}>{reasoning}</p>
      </div>
    </div>
  );
}

export default AiReasoningTooltip;
