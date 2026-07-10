import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';
import { EventDto } from '../types/shared';

export interface UseEventsQueryOptions {
  from: string;
  to: string;
  source?: EventDto['source'];
  enabled?: boolean;
}

/**
 * Keyed on ['events', from, to, source] so range/filter changes trigger a
 * fresh fetch while identical ranges hit cache — matches the access pattern
 * CalendarGrid already relies on inline; this is the extracted, reusable form.
 */
export function useEventsQuery({ from, to, source, enabled = true }: UseEventsQueryOptions) {
  return useQuery({
    queryKey: ['events', from, to, source ?? 'all'],
    queryFn: () => eventsApi.list(from, to, source),
    staleTime: 60_000,
    enabled,
  });
}
