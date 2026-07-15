
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
    <div className="flex flex-col gap-1.5 overflow-y-auto">
      {notes.map((note) => (
        <button
          key={note._id}
          type="button"
          onClick={() => onSelect(note._id)}
          className={`rounded-md p-3 text-left ${
            activeNoteId === note._id ? 'bg-bg-elevated' : 'bg-bg-surface'
          }`}
        >
          <p className="m-0 text-[13px] text-text-primary">{extractPreview(note.contentRichText).slice(0, 80)}</p>
          <div className="mt-1.5 flex justify-between">
            <span className="text-[11px] text-text-secondary">{formatISTDate(note.updatedAt)}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note._id);
              }}
              className="text-[11px] text-danger"
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