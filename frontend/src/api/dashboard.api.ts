import apiClient from './client';
import { EventDto, NoteDto } from '../types/shared';

export interface DashboardSummary {
  upcomingEvents: EventDto[];
  recentNotes: NoteDto[];
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [eventsRes, notesRes] = await Promise.all([
      apiClient.get<{ events: EventDto[] }>('/events', {
        params: { from: now.toISOString(), to: weekAhead.toISOString() },
      }),
      apiClient.get<{ notes: NoteDto[] }>('/notes'),
    ]);

    return {
      upcomingEvents: eventsRes.data.events.slice(0, 5),
      recentNotes: notesRes.data.notes.slice(0, 4),
    };
  },
};