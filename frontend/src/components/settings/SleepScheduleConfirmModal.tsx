
import { Moon } from 'lucide-react';

interface SleepScheduleConfirmModalProps {
  futureCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isRegenerating: boolean;
}

/**
 * The "adjust after asking" confirmation, per explicit requirement — never
 * silently replaces existing auto-scheduled sleep blocks when the sleep
 * window preference changes.
 */
export function SleepScheduleConfirmModal({
  futureCount,
  onConfirm,
  onCancel,
  isRegenerating,
}: SleepScheduleConfirmModalProps) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[400px] max-w-[90vw] rounded-lg border-t-4 border-accent-ashna bg-bg-surface p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <Moon size={18} className="text-accent-ashna" />
          <h2 className="m-0 text-[16px] text-text-primary">Update your sleep schedule?</h2>
        </div>
        <p className="mb-5 text-[13px] text-text-secondary">
          You have <strong className="text-text-primary">{futureCount}</strong> upcoming auto-scheduled sleep block
          {futureCount === 1 ? '' : 's'} based on your previous sleep window. Replace{' '}
          {futureCount === 1 ? 'it' : 'them'} with a fresh 10-day schedule using your new sleep window?
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-pill bg-bg-elevated px-4 py-2 text-[13px] text-text-primary"
          >
            Keep existing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRegenerating}
            className={`rounded-pill bg-accent-ashna px-4 py-2 text-[13px] font-semibold text-bg-primary ${
              isRegenerating ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            {isRegenerating ? 'Updating…' : 'Replace with new schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SleepScheduleConfirmModal;