import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';

/**
 * Powers CalendarGrid's merge of Google Calendar events into the actual
 * grid display — distinct from useGoogleCalendarEventsQuery (the fixed
 * "upcoming 20" list that still powers the sidebar preview widget).
 */
export function useGoogleCalendarRangeQuery(from: string, to: string) {
  return useQuery({
    queryKey: ['google-calendar-range', from, to],
    queryFn: () => eventsApi.listGoogleInRange(from, to),
    staleTime: 5 * 60 * 1000,
  });
}