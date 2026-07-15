
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-6 py-12 text-center text-text-secondary">
      <Icon size={28} strokeWidth={1.5} />
      <p className="m-0 text-sm font-semibold text-text-primary">{title}</p>
      {description && <p className="m-0 max-w-[280px] text-[13px]">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-pill bg-bg-elevated px-4 py-2 text-[13px] text-text-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;