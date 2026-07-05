// apps/web/src/hooks/useContests.ts
// TanStack Query hooks for contests
import { useQuery } from '@tanstack/react-query';
import { contestService } from '../services/contestService';
export const CONTEST_KEYS = {
    all: ['contests'],
    list: (params) => [...CONTEST_KEYS.all, 'list', params],
    upcoming: (days) => [...CONTEST_KEYS.all, 'upcoming', days],
    today: () => [...CONTEST_KEYS.all, 'today'],
    stats: () => [...CONTEST_KEYS.all, 'stats'],
    detail: (id) => [...CONTEST_KEYS.all, 'detail', id],
};
export function useContests(params) {
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
export function useContest(id) {
    return useQuery({
        queryKey: CONTEST_KEYS.detail(id),
        queryFn: () => contestService.getById(id),
        enabled: !!id,
    });
}
//# sourceMappingURL=useContests.js.map