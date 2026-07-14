import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyNote, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { notesApi } from '../api/notes.api';
import { NoteEditor } from '../components/notes/NoteEditor';
import { NotesList } from '../components/notes/NotesList';
import { EventPicker } from '../components/notes/EventPicker';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EventDto } from '../types/shared';

type ComposerState =
  | { mode: 'none' }
  | { mode: 'picking-event' } // choosing which event to write about
  | { mode: 'editing-standalone' } // note not linked to any event
  | { mode: 'editing-for-event'; event: EventDto }
  | { mode: 'editing-existing'; noteId: string };

export function NotesPage() {
  const queryClient = useQueryClient();
  const [composer, setComposer] = useState<ComposerState>({ mode: 'none' });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.list(),
  });

  const { mutate: removeNote } = useMutation({
    mutationFn: (noteId: string) => notesApi.remove(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const activeExistingNote =
    composer.mode === 'editing-existing' ? notes.find((n) => n._id === composer.noteId) : undefined;

  const handleDelete = (noteId: string) => {
    removeNote(noteId);
    if (composer.mode === 'editing-existing' && composer.noteId === noteId) {
      setComposer({ mode: 'none' });
    }
  };

  return (
    <div className="grid h-full grid-cols-[320px_1fr] gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-xl text-text-primary">Notes</h1>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setComposer({ mode: 'picking-event' })}
              title="Write about a specific calendar event"
              className="flex items-center gap-1 rounded-pill bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-primary"
            >
              <CalendarIcon size={13} /> For event
            </button>
            <button
              type="button"
              onClick={() => setComposer({ mode: 'editing-standalone' })}
              className="flex items-center gap-1 rounded-pill bg-accent-ashna px-3 py-1.5 text-xs font-semibold text-bg-primary"
            >
              <Plus size={13} /> New
            </button>
          </div>
        </div>

        {isLoading && <LoadingSpinner label="Loading notes…" />}

        {!isLoading && notes.length === 0 && (
          <EmptyState
            icon={StickyNote}
            title="No notes yet"
            description="Write a standalone note, or pick an event to reflect on."
            action={{ label: 'Write your first note', onClick: () => setComposer({ mode: 'editing-standalone' }) }}
          />
        )}

        <NotesList
          notes={notes}
          activeNoteId={composer.mode === 'editing-existing' ? composer.noteId : null}
          onSelect={(noteId) => setComposer({ mode: 'editing-existing', noteId })}
          onDelete={handleDelete}
        />
      </div>

      <div>
        {composer.mode === 'picking-event' && (
          <EventPicker
            onSelect={(event) => setComposer({ mode: 'editing-for-event', event })}
            onCancel={() => setComposer({ mode: 'none' })}
          />
        )}

        {composer.mode === 'editing-standalone' && (
          <NoteEditor onSaved={() => setComposer({ mode: 'none' })} />
        )}

        {composer.mode === 'editing-for-event' && (
          <NoteEditor
            eventId={composer.event._id}
            eventTitle={composer.event.title}
            onSaved={() => setComposer({ mode: 'none' })}
          />
        )}

        {composer.mode === 'editing-existing' && activeExistingNote && (
          <NoteEditor
            noteId={activeExistingNote._id}
            eventId={activeExistingNote.eventId}
            initialContent={activeExistingNote.contentRichText}
            onSaved={() => setComposer({ mode: 'none' })}
          />
        )}

        {composer.mode === 'none' && (
          <EmptyState
            icon={StickyNote}
            title="Select or create a note"
            description="Choose a note from the list, write a standalone note, or pick an event to write about."
          />
        )}
      </div>
    </div>
  );
}

export default NotesPage;