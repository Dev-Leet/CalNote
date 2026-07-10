import React from 'react';
import { Trophy } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

/**
 * FR-4's contest-overlay show/hide control, referenced in Section 7.6's
 * component breakdown but never built. Wire into CalendarPage's toolbar area
 * alongside AiProviderSwitch — CalendarGrid should read
 * useUiStore(s => s.showContestOverlay) to filter contest-derived events
 * in/out of the rendered event list.
 */
export function ContestOverlayToggle() {
  const showContestOverlay = useUiStore((s) => s.showContestOverlay);
  const toggleContestOverlay = useUiStore((s) => s.toggleContestOverlay);

  return (
    <button
      type="button"
      onClick={toggleContestOverlay}
      aria-pressed={showContestOverlay}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '9999px',
        border: 'none',
        background: showContestOverlay ? 'var(--color-contest-badge)' : 'var(--color-bg-elevated)',
        color: showContestOverlay ? '#0B0F19' : 'var(--color-text-secondary)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <Trophy size={14} aria-hidden="true" />
      {showContestOverlay ? 'Contests shown' : 'Contests hidden'}
    </button>
  );
}

export default ContestOverlayToggle;
