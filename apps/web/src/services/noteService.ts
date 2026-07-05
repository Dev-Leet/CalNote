// apps/web/src/services/noteService.ts
// Notes API calls

import { apiClient } from './api';
import { Note } from '@cp-calendar/shared';

export interface CreateNoteInput {
  contestId?: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface GenerateNoteInput {
  contestId: string;
  userPrompt?: string;
  skillLevel?: string;
}

export const noteService = {
  getNotes: async (contestId?: string): Promise<Note[]> => {
    const res = await apiClient.get<{ success: boolean; data: Note[] }>('/notes', {
      params: contestId ? { contestId } : undefined,
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Note> => {
    const res = await apiClient.get<{ success: boolean; data: Note }>(`/notes/${id}`);
    return res.data.data;
  },

  create: async (input: CreateNoteInput): Promise<Note> => {
    const res = await apiClient.post<{ success: boolean; data: Note }>('/notes', input);
    return res.data.data;
  },

  update: async (id: string, input: Partial<CreateNoteInput>): Promise<Note> => {
    const res = await apiClient.put<{ success: boolean; data: Note }>(`/notes/${id}`, input);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },

  generate: async (input: GenerateNoteInput): Promise<Note> => {
    const res = await apiClient.post<{ success: boolean; data: Note }>('/notes/generate', input);
    return res.data.data;
  },
};
