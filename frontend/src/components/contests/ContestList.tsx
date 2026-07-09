import React, { useState, useMemo } from 'react';
import { ContestCard, ContestVM } from './ContestCard';

interface ContestListProps {
  contests: ContestVM[];
  isLoading?: boolean;
  onScheduleAround?: (contest: ContestVM) => void;
}

export function ContestList({ contests, isLoading, onScheduleAround }: ContestListProps) {
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const platforms = useMemo(
    () => ['all', ...Array.from(new Set(contests.map((c) => c.platform)))],
    [contests],
  );

  const filtered = useMemo(
    () => (platformFilter === 'all' ? contests : contests.filter((c) => c.platform === platformFilter)),
    [contests, platformFilter],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {platforms.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatformFilter(p)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: platformFilter === p ? 'var(--color-accent-ashna)' : 'var(--color-bg-elevated)',
              color: platformFilter === p ? '#0B0F19' : 'var(--color-text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading contests…</p>}

      {!isLoading && filtered.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No upcoming contests found.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {filtered.map((contest) => (
          <ContestCard key={contest.id} contest={contest} onScheduleAround={onScheduleAround} />
        ))}
      </div>
    </div>
  );
}

export default ContestList;
