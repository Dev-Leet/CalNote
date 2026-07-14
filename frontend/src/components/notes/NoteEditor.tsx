import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useEditorSelectionContext } from '../../hooks/useEditorSelectionContext';
import { AiContextBox } from './AiContextBox';
 
interface NoteEditorProps {
  noteId?: string;
  eventId?: string;
  eventTitle?: string;     // for display only — shows which event this note is about
  initialContent?: string;
  onSaved?: () => void;
}

interface SaveNotePayload {
  contentRichText: string;
  eventId?: string;
}

async function saveNote(noteId: string | undefined, payload: SaveNotePayload) {
  if (noteId) {
    const { data } = await apiClient.patch(`/notes/${noteId}`, { contentRichText: payload.contentRichText });
    return data.note;
  }
  const { data } = await apiClient.post('/notes', payload);
  return data.note;
}

export function NoteEditor({ noteId, eventId, eventTitle, initialContent, onSaved }: NoteEditorProps) {
  const queryClient = useQueryClient();

  const editor = useEditor({
    extensions: [StarterKit, CodeBlock],
    content: initialContent ? JSON.parse(initialContent) : '',
    editorProps: {
      attributes: {
        style: 'min-height: 160px; padding: 12px; outline: none; font-size: 14px; color: var(--color-text-primary);',
      },
    },
  });

  // Task 3: highlight-to-ask-AI. Tracks the current selection inside the
  // editor and surfaces a floating AiContextBox anchored to it.
  const { selection, clearSelection } = useEditorSelectionContext(editor);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: SaveNotePayload) => saveNote(noteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      onSaved?.();
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;
    const contentRichText = JSON.stringify(editor.getJSON());
    mutate({ contentRichText, eventId });
  };

  if (!editor) return null;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-md border border-bg-elevated bg-bg-surface">
      {eventTitle && (
        <div className="border-b border-bg-elevated bg-accent-ashna-tint px-3.5 py-2">
          <p className="m-0 text-[11px] font-semibold uppercase text-accent-ashna">Writing about</p>
          <p className="m-0 text-[13px] text-text-primary">{eventTitle}</p>
        </div>
      )}
      {selection && (
        <AiContextBox
          selectedText={selection.text}
          position={{ top: selection.top, left: selection.left }}
          onClose={clearSelection}
        />
      )}
      <div className="flex gap-1.5 border-b border-bg-elevated px-3 py-2">
        <ToolbarButton label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="•" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="{ }" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      </div>

      <EditorContent editor={editor} />

      <div className="flex justify-end border-t border-bg-elevated px-3 py-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={`rounded-pill bg-accent-ashna px-4 py-1.5 text-[13px] font-semibold text-bg-primary ${
            isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {isPending ? 'Saving…' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 w-7 rounded-sm text-xs font-bold ${
        active ? 'bg-accent-ashna text-bg-primary' : 'bg-bg-elevated text-text-secondary'
      }`}
    >
      {label}
    </button>
  );
}

export default NoteEditor;
