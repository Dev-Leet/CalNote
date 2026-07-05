// apps/web/src/hooks/useContests.ts
// TanStack Query hooks for contests

import { useQuery } from '@tanstack/react-query';
import { contestService } from '../services/contestService';
import { Platform } from '@cp-calendar/shared';

export const CONTEST_KEYS = {
  all: ['contests'] as const,
  list: (params?: { platform?: Platform; upcoming?: boolean }) =>
    [...CONTEST_KEYS.all, 'list', params] as const,
  upcoming: (days?: number) => [...CONTEST_KEYS.all, 'upcoming', days] as const,
  today: () => [...CONTEST_KEYS.all, 'today'] as const,
  stats: () => [...CONTEST_KEYS.all, 'stats'] as const,
  detail: (id: string) => [...CONTEST_KEYS.all, 'detail', id] as const,
};

export function useContests(params?: { platform?: Platform; upcoming?: boolean; page?: number }) {
  return useQuery({
    queryKey: CONTEST_KEYS.list(params),
    queryFn: () => contestService.getContests(params),
  });
}

export function useUpcomingContests(days = 30) {
  return useQuery({
    queryKey: CONTEST_KEYS.upcoming(days),
    queryFn: () => contestService.getUpcoming(days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTodayContests() {
  return useQuery({
    queryKey: CONTEST_KEYS.today(),
    queryFn: () => contestService.getToday(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useContestStats() {
  return useQuery({
    queryKey: CONTEST_KEYS.stats(),
    queryFn: () => contestService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useContest(id: string) {
  return useQuery({
    queryKey: CONTEST_KEYS.detail(id),
    queryFn: () => contestService.getById(id),
    enabled: !!id,
  });
}
