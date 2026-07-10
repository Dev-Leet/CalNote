import { useQuery } from '@tanstack/react-query';
import { contestsApi, ContestFilters } from '../api/contests.api';

/**
 * Long staleTime (~25 min) matching the 30-min scrape cron, per Section 7.5,
 * to avoid redundant fetches between scrape cycles.
 */
export function useContestsQuery(filters: ContestFilters = {}) {
  return useQuery({
    queryKey: ['contests', filters.platform ?? 'all', filters.from ?? '', filters.to ?? ''],
    queryFn: () => contestsApi.list(filters),
    staleTime: 25 * 60 * 1000,
  });
}
