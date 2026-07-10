import apiClient from './client';
import { EventDto } from '../types/shared';

export interface CreateEventPayload {
  title: string;
  startTime: string;
  endTime: string;
  recurrence?: EventDto['recurrence'];
  force?: boolean;
}

export interface UpdateEventPayload {
  title?: string;
  startTime?: string;
  endTime?: string;
  recurrence?: EventDto['recurrence'];
}

export const eventsApi = {
  async list(from: string, to: string, source?: EventDto['source']): Promise<EventDto[]> {
    const { data } = await apiClient.get<{ events: EventDto[] }>('/events', {
      params: { from, to, source },
    });
    return data.events;
  },

  async create(payload: CreateEventPayload): Promise<EventDto> {
    const { data } = await apiClient.post<{ event: EventDto }>('/events', payload);
    return data.event;
  },

  async update(eventId: string, payload: UpdateEventPayload): Promise<EventDto> {
    const { data } = await apiClient.patch<{ event: EventDto }>(`/events/${eventId}`, payload);
    return data.event;
  },

  async remove(eventId: string, cascadeNote = false): Promise<void> {
    await apiClient.delete(`/events/${eventId}`, { params: { cascadeNote } });
  },
};
