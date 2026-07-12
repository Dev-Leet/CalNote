import React from 'react';
import { useAiProviderStore, AiProviderType } from '../../stores/aiProviderStore';

interface AiProviderSwitchProps {
  compact?: boolean;
}

const OPTIONS: { value: AiProviderType; label: string; activeClass: string }[] = [
  { value: 'ashna', label: 'Ashna AI', activeClass: 'bg-accent-ashna text-bg-primary' },
  { value: 'custom', label: 'Custom AI Agent', activeClass: 'bg-accent-custom text-bg-primary' },
];

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
      className="inline-flex gap-1 rounded-pill bg-bg-elevated p-1"
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
            className={`rounded-pill font-semibold transition-colors ${
              compact ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm'
            } ${isActive ? option.activeClass : 'text-text-secondary'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default AiProviderSwitch;