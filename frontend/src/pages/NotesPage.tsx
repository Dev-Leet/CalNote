import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyNote, Plus } from 'lucide-react';
import apiClient from '../api/client';
import { NoteEditor } from '../components/notes/NoteEditor';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { NoteDto } from '../types/shared';

async function fetchNotes(): Promise<NoteDto[]> {
  const { data } = await apiClient.get<{ notes: NoteDto[] }>('/notes');
  return data.notes;
}

async function deleteNote(noteId: string): Promise<void> {
  await apiClient.delete(`/notes/${noteId}`);
}

function extractPreview(contentRichText: string): string {
  try {
    const parsed = JSON.parse(contentRichText);
    const walk = (node: any): string => {
      if (!node) return '';
      if (node.type === 'text') return node.text ?? '';
      if (Array.isArray(node.content)) return node.content.map(walk).join(' ');
      return '';
    };
    return walk(parsed).trim() || 'Empty note';
  } catch {
    return 'Untitled note';
  }
}

export function NotesPage() {
  const queryClient = useQueryClient();
  const [activeNoteId, setActiveNoteId] = useState<string | 'new' | null>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });

  const { mutate: removeNote } = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const activeNote = notes.find((n) => n._id === activeNoteId) ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: 'var(--color-text-primary)', fontSize: '20px', margin: 0 }}>Notes</h1>
          <button
            type="button"
            onClick={() => setActiveNoteId('new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--color-accent-ashna)',
              color: '#0B0F19',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> New
          </button>
        </div>

        {isLoading && <LoadingSpinner label="Loading notes…" />}

        {!isLoading && notes.length === 0 && (
          <EmptyState
            icon={StickyNote}
            title="No notes yet"
            description="Notes you write standalone or attach to calendar events will show up here."
            action={{ label: 'Write your first note', onClick: () => setActiveNoteId('new') }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {notes.map((note) => (
            <button
              key={note._id}
              type="button"
              onClick={() => setActiveNoteId(note._id)}
              style={{
                textAlign: 'left',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: activeNoteId === note._id ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
                cursor: 'pointer',
              }}
            >
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                {extractPreview(note.contentRichText).slice(0, 80)}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {new Date(note.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNote(note._id);
                    if (activeNoteId === note._id) setActiveNoteId(null);
                  }}
                  style={{ fontSize: '11px', color: 'var(--color-danger)', cursor: 'pointer' }}
                >
                  Delete
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeNoteId === 'new' && (
          <NoteEditor onSaved={() => setActiveNoteId(null)} />
        )}
        {activeNote && (
          <NoteEditor
            noteId={activeNote._id}
            eventId={activeNote.eventId}
            initialContent={activeNote.contentRichText}
            onSaved={() => setActiveNoteId(null)}
          />
        )}
        {activeNoteId === null && (
          <EmptyState icon={StickyNote} title="Select a note" description="Choose a note from the list, or create a new one." />
        )}
      </div>
    </div>
  );
}

export default NotesPage;