import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  fullHeight?: boolean;
}

/**
 * Reusable loading indicator. Replaces the ad hoc "Loading…" text strings
 * scattered across CalendarGrid, ContestList, SettingsPage, etc.
 */
export function LoadingSpinner({ size = 24, label, fullHeight = false }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '24px',
        height: fullHeight ? '100%' : undefined,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid var(--color-bg-elevated)`,
          borderTopColor: 'var(--color-accent-ashna)',
          animation: 'cp-spin 0.7s linear infinite',
        }}
      />
      {label && <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{label}</span>}
      <style>{`
        @keyframes cp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;
