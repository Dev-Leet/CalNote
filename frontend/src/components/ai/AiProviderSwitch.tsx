import React from 'react';
import { useAiProviderStore, AiProviderType } from '../../stores/aiProviderStore';

interface AiProviderSwitchProps {
  compact?: boolean;
}

const OPTIONS: { value: AiProviderType; label: string; accentVar: string }[] = [
  { value: 'ashna', label: 'Ashna AI', accentVar: 'var(--color-accent-ashna)' },
  { value: 'custom', label: 'Custom AI Agent', accentVar: 'var(--color-accent-custom)' },
];

/**
 * Accessible segmented control for the Ashna vs Custom AI Agent toggle.
 * Implements role="radiogroup" with arrow-key navigation per WAI-ARIA
 * segmented-control pattern (Section 7.6 of the UI/UX spec).
 */
export function AiProviderSwitch({ compact = false }: AiProviderSwitchProps) {
  const provider = useAiProviderStore((state) => state.provider);
  const setProvider = useAiProviderStore((state) => state.setProvider);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = OPTIONS.findIndex((o) => o.value === provider);
      const nextIndex =
        e.key === 'ArrowRight'
          ? (currentIndex + 1) % OPTIONS.length
          : (currentIndex - 1 + OPTIONS.length) % OPTIONS.length;
      setProvider(OPTIONS[nextIndex].value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="AI provider selection"
      onKeyDown={handleKeyDown}
      style={{
        display: 'inline-flex',
        borderRadius: '9999px',
        padding: '4px',
        background: 'var(--color-bg-elevated)',
        gap: '4px',
      }}
    >
      {OPTIONS.map((option) => {
        const isActive = provider === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setProvider(option.value)}
            style={{
              border: 'none',
              cursor: 'pointer',
              borderRadius: '9999px',
              padding: compact ? '6px 12px' : '8px 16px',
              fontSize: compact ? '13px' : '14px',
              fontWeight: 600,
              color: isActive ? '#0B0F19' : 'var(--color-text-secondary)',
              background: isActive ? option.accentVar : 'transparent',
              transition: 'background 150ms ease, color 150ms ease',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default AiProviderSwitch;
