import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { ContestList } from '../components/contests/ContestList';
import { ContestVM } from '../components/contests/ContestCard';

interface RawContestDto {
  _id: string;
  platform: string;
  name: string;
  startTime: string;
  endTime: string;
  url: string;
  durationMinutes: number;
}

async function fetchContests(): Promise<ContestVM[]> {
  const { data } = await apiClient.get<{ contests: RawContestDto[] }>('/contests');
  return data.contests.map((c) => ({
    id: c._id,
    platform: c.platform,
    name: c.name,
    startTime: c.startTime,
    endTime: c.endTime,
    url: c.url,
    durationMinutes: c.durationMinutes,
  }));
}

export function ContestsPage() {
  const { data: contests = [], isLoading } = useQuery({
    queryKey: ['contests'],
    queryFn: fetchContests,
    staleTime: 25 * 60 * 1000, // ~25 min, just under the 30-min scrape cron interval
  });

  const handleScheduleAround = (contest: ContestVM) => {
    // Intended integration point: pre-fill AiChatPanel's prompt input, e.g. via
    // a shared Zustand "draftPrompt" store or navigation state, then route to
    // /calendar. Left as a hook for wiring once AiChatPanel exposes a
    // controlled prompt-input mode.
    console.log('Schedule around contest:', contest.name);
  };

  return (
    <div>
      <h1 style={{ color: 'var(--color-text-primary)', fontSize: '22px', marginBottom: '16px' }}>
        Upcoming Contests
      </h1>
      <ContestList contests={contests} isLoading={isLoading} onScheduleAround={handleScheduleAround} />
    </div>
  );
}

export default ContestsPage;
