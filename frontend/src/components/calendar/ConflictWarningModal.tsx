import React from 'react';

export interface ConflictingEventSummary {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

interface ConflictWarningModalProps {
  isOpen: boolean;
  conflicts: ConflictingEventSummary[];
  onCancel: () => void;
  onProceedAnyway: () => void;
}

export function ConflictWarningModal({ isOpen, conflicts, onCancel, onProceedAnyway }: ConflictWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] rounded-lg border-t-4 border-warning bg-bg-surface p-6"
      >
        <h2 id="conflict-modal-title" className="mb-2 mt-0 text-[17px] text-text-primary">
          This overlaps {conflicts.length === 1 ? 'an existing event' : `${conflicts.length} existing events`}
        </h2>
        <p className="mb-4 text-[13px] text-text-secondary">Scheduling here will overlap the following:</p>

        <ul className="m-0 mb-5 flex list-none flex-col gap-2 p-0">
          {conflicts.map((c) => (
            <li key={c.id} className="rounded-md bg-bg-elevated px-3 py-2.5 text-[13px] text-text-primary">
              <strong>{c.title}</strong>
              <br />
              <span className="text-xs text-text-secondary">
                {new Date(c.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} &ndash;{' '}
                {new Date(c.endTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-pill bg-bg-elevated px-4 py-2 text-[13px] text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceedAnyway}
            className="rounded-pill bg-danger px-4 py-2 text-[13px] font-semibold text-bg-primary"
          >
            Schedule Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictWarningModal;