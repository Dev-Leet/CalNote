
import { NoteDto } from '../../types/shared';
import { formatISTDate } from '../../utils/formatters';
 
interface NotesListProps {
  notes: NoteDto[];
  activeNoteId: string | 'new' | null;
  onSelect: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
}

function extractPreview(contentRichText: string): string {
  try {
    const parsed = JSON.parse(contentRichText) as TipTapNode;
    const walk = (node: TipTapNode | undefined): string => {
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

export function NotesList({ notes, activeNoteId, onSelect, onDelete }: NotesListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      {notes.map((note) => (
        <button
          key={note._id}
          type="button"
          onClick={() => onSelect(note._id)}
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
              {formatISTDate(note.updatedAt)}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note._id);
              }}
              style={{ fontSize: '11px', color: 'var(--color-danger)', cursor: 'pointer' }}
            >
              Delete
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default NotesList;
