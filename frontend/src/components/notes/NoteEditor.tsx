import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

interface NoteEditorProps {
  noteId?: string;         // undefined = creating a new note
  eventId?: string;        // optional link to a parent event
  initialContent?: string; // serialized TipTap JSON string
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

export function NoteEditor({ noteId, eventId, initialContent, onSaved }: NoteEditorProps) {
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-bg-elevated)',
        borderRadius: '10px',
        background: 'var(--color-bg-surface)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-bg-elevated)',
        }}
      >
        <ToolbarButton label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="•" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="{ }" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      </div>

      <EditorContent editor={editor} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', borderTop: '1px solid var(--color-bg-elevated)' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          style={{
            padding: '6px 16px',
            borderRadius: '9999px',
            border: 'none',
            background: 'var(--color-accent-ashna)',
            color: '#0B0F19',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
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
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        background: active ? 'var(--color-accent-ashna)' : 'var(--color-bg-elevated)',
        color: active ? '#0B0F19' : 'var(--color-text-secondary)',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export default NoteEditor;
