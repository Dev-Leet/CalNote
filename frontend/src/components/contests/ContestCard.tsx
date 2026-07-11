import { useEffect, useState } from 'react';
 
export interface ContestVM {
  id: string;
  platform: string;
  name: string;
  startTime: string; // IST ISO string
  endTime: string;
  url: string;
  durationMinutes: number;
}

const PLATFORM_COLOR: Record<string, string> = {
  codeforces: '#FB7185',
  leetcode: '#FBBF24',
  codechef: '#7C5CFC',
  atcoder: '#2DD4BF',
};

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
  const accent = PLATFORM_COLOR[contest.platform] ?? 'var(--color-contest-badge)';

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'var(--color-bg-surface)',
        borderLeft: `4px solid ${accent}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>
          {contest.platform}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{countdown}</span>
      </div>

      <a
        href={contest.url}
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--color-text-primary)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}
      >
        {contest.name}
      </a>

      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {new Date(contest.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} &middot;{' '}
        {contest.durationMinutes} min
      </p>

      {onScheduleAround && (
        <button
          type="button"
          onClick={() => onScheduleAround(contest)}
          style={{
            alignSelf: 'flex-start',
            marginTop: '4px',
            padding: '6px 12px',
            borderRadius: '9999px',
            border: 'none',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Schedule around this
        </button>
      )}
    </div>
  );
}

export default ContestCard;
