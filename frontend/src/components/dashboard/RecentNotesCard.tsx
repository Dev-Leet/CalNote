
import { StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardCard } from './DashboardCard';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatISTDate } from '../../utils/formatters';
import { NoteDto } from '../../types/shared';

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

interface RecentNotesCardProps {
  notes: NoteDto[];
  isLoading: boolean;
}

export function RecentNotesCard({ notes, isLoading }: RecentNotesCardProps) {
  const navigate = useNavigate();

  return (
    <DashboardCard title="Quick Notes" icon={StickyNote} viewAllHref="/notes" viewAllLabel="Open notes">
      {isLoading && <LoadingSpinner label="Loading notes…" />}

      {!isLoading && notes.length === 0 && (
        <EmptyState icon={StickyNote} title="No notes yet" description="Reflect on a contest or jot something down." />
      )}

      <div className="flex flex-col gap-2">
        {notes.map((note) => (
          <button
            key={note._id}
            type="button"
            onClick={() => navigate('/notes')}
            className="rounded-md bg-bg-elevated px-3 py-2.5 text-left"
          >
            <p className="m-0 truncate text-[13px] text-text-primary">{extractPreview(note.contentRichText)}</p>
            <p className="m-0 mt-0.5 text-[11px] text-text-secondary">{formatISTDate(note.updatedAt)}</p>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}

export default RecentNotesCard;