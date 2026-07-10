import { QueryClient } from '@tanstack/react-query';

/**
 * Central TanStack Query client. Default staleTime is deliberately non-zero
 * (30s) since most of this app's data (events, contests) doesn't change
 * every second — individual queries override this where a tighter or looser
 * window makes sense (e.g. contests: ~25min, matching the scrape cron).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});