
import { LucideIcon, Inbox } from 'lucide-react';
 
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Reusable empty-state block. Replaces the inline "No upcoming contests
 * found." / similar one-off <p> tags in ContestList, NotesList, etc. with a
 * consistent, slightly more helpful pattern (icon + title + optional action).
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      <Icon size={28} strokeWidth={1.5} />
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{title}</p>
      {description && <p style={{ fontSize: '13px', margin: 0, maxWidth: '280px' }}>{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            border: 'none',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;