import React from 'react';

interface PlatformFilterBarProps {
  platforms: string[];
  active: string;
  onChange: (platform: string) => void;
}

export function PlatformFilterBar({ platforms, active, onChange }: PlatformFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-pressed={active === p}
          className={`rounded-pill px-3.5 py-1.5 text-xs font-semibold capitalize ${
            active === p ? 'bg-accent-ashna text-bg-primary' : 'bg-bg-elevated text-text-secondary'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export default PlatformFilterBar;