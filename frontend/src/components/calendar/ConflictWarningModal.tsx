import React from 'react';

export interface ConflictingEventSummary {
  id: string;
  title: string;
  startTime: string; // IST ISO string
  endTime: string;
}

interface ConflictWarningModalProps {
  isOpen: boolean;
  conflicts: ConflictingEventSummary[];
  onCancel: () => void;
  onProceedAnyway: () => void;
}

/**
 * FR-4.2: surfaces a non-blocking warning when a new/edited event overlaps
 * existing event(s) — including contest blocks, which are the highest-stakes
 * case (e.g. accidentally scheduling practice over a live round).
 */
export function ConflictWarningModal({ isOpen, conflicts, onCancel, onProceedAnyway }: ConflictWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11, 15, 25, 0.65)',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '420px',
          padding: '24px',
          borderRadius: '16px',
          background: 'var(--color-bg-surface)',
          borderTop: '4px solid var(--color-warning)',
        }}
      >
        <h2 id="conflict-modal-title" style={{ color: 'var(--color-text-primary)', fontSize: '17px', margin: '0 0 8px' }}>
          This overlaps {conflicts.length === 1 ? 'an existing event' : `${conflicts.length} existing events`}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Scheduling here will overlap the following:
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {conflicts.map((c) => (
            <li
              key={c.id}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--color-bg-elevated)',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
              }}
            >
              <strong>{c.title}</strong>
              <br />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                {new Date(c.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} &ndash;{' '}
                {new Date(c.endTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
              </span>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button type="button" onClick={onProceedAnyway} style={dangerButtonStyle}>
            Schedule Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: 'none',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-primary)',
  fontSize: '13px',
  cursor: 'pointer',
};

const dangerButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: 'none',
  background: 'var(--color-danger)',
  color: '#0B0F19',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
};

export default ConflictWarningModal;
