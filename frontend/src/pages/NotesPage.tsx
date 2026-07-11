import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyNote, Plus } from 'lucide-react';
import { notesApi } from '../api/notes.api';
import { NoteEditor } from '../components/notes/NoteEditor';
import { NotesList } from '../components/notes/NotesList';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function NotesPage() {
  const queryClient = useQueryClient();
  const [activeNoteId, setActiveNoteId] = useState<string | 'new' | null>(null);

  // Previously inline fetchNotes via apiClient directly — now uses notesApi,
  // the typed wrapper built specifically for this in an earlier phase.
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.list(),
  });

  const { mutate: removeNote } = useMutation({
    mutationFn: (noteId: string) => notesApi.remove(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const activeNote = notes.find((n) => n._id === activeNoteId) ?? null;

  const handleDelete = (noteId: string) => {
    removeNote(noteId);
    if (activeNoteId === noteId) setActiveNoteId(null);
  };

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

        {/* Previously inline extractPreview() + note-list JSX — now the extracted component */}
        <NotesList notes={notes} activeNoteId={activeNoteId} onSelect={setActiveNoteId} onDelete={handleDelete} />
      </div>

      <div>
        {activeNoteId === 'new' && <NoteEditor onSaved={() => setActiveNoteId(null)} />}
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