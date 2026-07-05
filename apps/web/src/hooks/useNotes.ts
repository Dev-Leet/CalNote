// apps/web/src/hooks/useNotes.ts
// TanStack Query hooks for notes

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '../services/noteService';
import { toast } from 'sonner';

export const NOTE_KEYS = {
  all: ['notes'] as const,
  list: (contestId?: string) => [...NOTE_KEYS.all, 'list', contestId] as const,
  detail: (id: string) => [...NOTE_KEYS.all, 'detail', id] as const,
};

export function useNotes(contestId?: string) {
  return useQuery({
    queryKey: NOTE_KEYS.list(contestId),
    queryFn: () => noteService.getNotes(contestId),
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: NOTE_KEYS.detail(id),
    queryFn: () => noteService.getById(id),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: noteService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTE_KEYS.all });
      toast.success('Note created!');
    },
    onError: () => toast.error('Failed to create note'),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; content?: string; tags?: string[] }) =>
      noteService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTE_KEYS.all });
      toast.success('Note saved!');
    },
    onError: () => toast.error('Failed to save note'),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: noteService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTE_KEYS.all });
      toast.success('Note deleted');
    },
    onError: () => toast.error('Failed to delete note'),
  });
}

export function useGenerateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: noteService.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTE_KEYS.all });
      toast.success('AI notes generated!');
    },
    onError: () => toast.error('Failed to generate notes'),
  });
}
