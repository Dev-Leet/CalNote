import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  viewAllHref: string;
  viewAllLabel?: string;
  children: React.ReactNode;
}

export function DashboardCard({ title, icon: Icon, viewAllHref, viewAllLabel = 'View all', children }: DashboardCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={16} className="flex-shrink-0 text-accent-ashna" />
          <h2 className="m-0 truncate text-sm font-semibold text-text-primary">{title}</h2>
        </div>
        <Link to={viewAllHref} className="flex flex-shrink-0 items-center gap-1 text-xs text-accent-ashna no-underline hover:underline">
          {viewAllLabel} <ArrowRight size={12} />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}

export default DashboardCard;