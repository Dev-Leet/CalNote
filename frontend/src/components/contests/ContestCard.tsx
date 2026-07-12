import React, { useEffect, useState } from 'react';

export interface ContestVM {
  id: string;
  platform: string;
  name: string;
  startTime: string;
  endTime: string;
  url: string;
  durationMinutes: number;
}

// Same rationale as EventDetailPopover's SOURCE_BORDER map — explicit
// literal classes per platform so Tailwind's scanner can see them all,
// rather than a dynamic template string it can't statically analyze.
const PLATFORM_ACCENT: Record<string, { border: string; text: string }> = {
  codeforces: { border: 'border-l-contest-badge', text: 'text-contest-badge' },
  leetcode: { border: 'border-l-warning', text: 'text-warning' },
  codechef: { border: 'border-l-accent-ashna', text: 'text-accent-ashna' },
  atcoder: { border: 'border-l-accent-custom', text: 'text-accent-custom' },
};
const DEFAULT_ACCENT = { border: 'border-l-contest-badge', text: 'text-contest-badge' };

function useCountdown(targetIso: string): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const update = () => {
      const diffMs = new Date(targetIso).getTime() - Date.now();
      if (diffMs <= 0) {
        setLabel('Live / Started');
        return;
      }
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      setLabel(days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    };

    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return label;
}

interface ContestCardProps {
  contest: ContestVM;
  onScheduleAround?: (contest: ContestVM) => void;
}

export function ContestCard({ contest, onScheduleAround }: ContestCardProps) {
  const countdown = useCountdown(contest.startTime);
  const accent = PLATFORM_ACCENT[contest.platform] ?? DEFAULT_ACCENT;

  return (
    <div className={`flex flex-col gap-2 rounded-md border-l-4 bg-bg-surface p-4 ${accent.border}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold uppercase ${accent.text}`}>{contest.platform}</span>
        <span className="text-xs text-text-secondary">{countdown}</span>
      </div>

      <a
        href={contest.url}
        target="_blank"
        rel="noreferrer"
        className="text-[15px] font-semibold text-text-primary no-underline hover:underline"
      >
        {contest.name}
      </a>

      <p className="m-0 text-xs text-text-secondary">
        {new Date(contest.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} &middot;{' '}
        {contest.durationMinutes} min
      </p>

      {onScheduleAround && (
        <button
          type="button"
          onClick={() => onScheduleAround(contest)}
          className="mt-1 self-start rounded-pill bg-bg-elevated px-3 py-1.5 text-xs text-text-primary"
        >
          Schedule around this
        </button>
      )}
    </div>
  );
}

export default ContestCard;