import apiClient from './client';
import { NoteDto } from '../types/shared';

export interface CreateNotePayload {
  contentRichText: string;
  eventId?: string;
}

export const notesApi = {
  async list(eventId?: string): Promise<NoteDto[]> {
    const { data } = await apiClient.get<{ notes: NoteDto[] }>('/notes', { params: { eventId } });
    return data.notes;
  },

  async create(payload: CreateNotePayload): Promise<NoteDto> {
    const { data } = await apiClient.post<{ note: NoteDto }>('/notes', payload);
    return data.note;
  },

  async update(noteId: string, contentRichText: string): Promise<NoteDto> {
    const { data } = await apiClient.patch<{ note: NoteDto }>(`/notes/${noteId}`, { contentRichText });
    return data.note;
  },

  async remove(noteId: string, cascadeNote = false): Promise<void> {
    await apiClient.delete(`/notes/${noteId}`, { params: { cascadeNote } });
  },
};
