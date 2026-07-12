import React from 'react';
import { Trophy } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

export function ContestOverlayToggle() {
  const showContestOverlay = useUiStore((s) => s.showContestOverlay);
  const toggleContestOverlay = useUiStore((s) => s.toggleContestOverlay);

  return (
    <button
      type="button"
      onClick={toggleContestOverlay}
      aria-pressed={showContestOverlay}
      className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold ${
        showContestOverlay ? 'bg-contest-badge text-bg-primary' : 'bg-bg-elevated text-text-secondary'
      }`}
    >
      <Trophy size={14} aria-hidden="true" />
      {showContestOverlay ? 'Contests shown' : 'Contests hidden'}
    </button>
  );
}

export default ContestOverlayToggle;