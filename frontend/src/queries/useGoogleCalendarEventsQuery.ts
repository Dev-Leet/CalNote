import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';

/**
 * Read-only view of the user's actual Google Calendar (via the backend
 * proxy), distinct from useEventsQuery (which reads CP Calendar Pro's own
 * Event collection). Intended for a "My Calendars" style widget showing
 * what's on Google independent of what's been synced into this app.
 */
export function useGoogleCalendarEventsQuery(enabled = true) {
  return useQuery({
    queryKey: ['google-calendar-upcoming'],
    queryFn: eventsApi.listGoogleUpcoming,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}