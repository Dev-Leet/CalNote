import apiClient from './client';

export type NotesAiInstruction = 'explain' | 'review_errors' | 'optimise' | 'custom';

export interface NotesAiAskPayload {
  selectedText: string;
  instruction: NotesAiInstruction;
  customQuestion?: string; // required when instruction === 'custom'
  noteContext?: string;
}

export interface NotesAiAskResponse {
  answer: string;
}

export const notesAiApi = {
  async ask(payload: NotesAiAskPayload): Promise<NotesAiAskResponse> {
    const { data } = await apiClient.post<NotesAiAskResponse>('/ai/notes/ask', payload);
    return data;
  },
};