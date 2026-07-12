import React, { useState, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { ContestCard, ContestVM } from './ContestCard';
import { PlatformFilterBar } from './PlatformFilterBar';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

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
    <div className="flex flex-col gap-4">
      <PlatformFilterBar platforms={platforms} active={platformFilter} onChange={setPlatformFilter} />

      {isLoading && <LoadingSpinner label="Loading contests…" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Trophy}
          title="No upcoming contests"
          description="Check back soon, or try a different platform filter."
        />
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {filtered.map((contest) => (
          <ContestCard key={contest.id} contest={contest} onScheduleAround={onScheduleAround} />
        ))}
      </div>
    </div>
  );
}

export default ContestList;