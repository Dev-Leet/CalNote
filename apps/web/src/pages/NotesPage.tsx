// apps/web/src/pages/NotesPage.tsx
// Notes management with list, editor, and AI generation

import { useState } from 'react';
import { Plus, Sparkles, Trash2, Edit2, Save, X, Tag, ChevronRight } from 'lucide-react';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useGenerateNote } from '../hooks/useNotes';
import { useUpcomingContests } from '../hooks/useContests';
import { Note } from '@cp-calendar/shared';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

type EditorMode = 'view' | 'edit' | 'create';

export default function NotesPage() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('view');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [generateModal, setGenerateModal] = useState(false);
  const [genContestId, setGenContestId] = useState('');
  const [genPrompt, setGenPrompt] = useState('');
  const [genSkill, setGenSkill] = useState('intermediate');

  const { data: notes = [], isLoading } = useNotes();
  const { data: contests = [] } = useUpcomingContests(30);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const generateNote = useGenerateNote();

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setEditorMode('view');
  };

  const startEdit = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setEditTags(selectedNote.tags.join(', '));
    setEditorMode('edit');
  };

  const startCreate = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('# My Notes\n\n');
    setEditTags('');
    setEditorMode('create');
  };

  const handleSave = async () => {
    const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    if (editorMode === 'create') {
      const note = await createNote.mutateAsync({ title: editTitle, content: editContent, tags });
      setSelectedNote(note);
      setEditorMode('view');
    } else if (editorMode === 'edit' && selectedNote) {
      const note = await updateNote.mutateAsync({ id: selectedNote.id, title: editTitle, content: editContent, tags });
      setSelectedNote(note);
      setEditorMode('view');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await deleteNote.mutateAsync(id);
    if (selectedNote?.id === id) { setSelectedNote(null); setEditorMode('view'); }
  };

  const handleGenerate = async () => {
    const note = await generateNote.mutateAsync({ contestId: genContestId, userPrompt: genPrompt || undefined, skillLevel: genSkill });
    setGenerateModal(false);
    setSelectedNote(note);
    setEditorMode('view');
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)] animate-fade-in">
      {/* Note list sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex gap-2">
          <button onClick={startCreate} className="btn-primary flex-1 text-sm justify-center py-2">
            <Plus size={15} /> New Note
          </button>
          <button onClick={() => setGenerateModal(true)} className="btn-secondary text-sm px-3 py-2" title="AI Generate">
            <Sparkles size={15} className="text-purple-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading && [...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-16 animate-pulse !p-3">
              <div className="h-3 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-2 bg-white/5 rounded w-1/2" />
            </div>
          ))}

          {!isLoading && notes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Edit2 size={28} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs mt-1">Create or AI-generate one</p>
            </div>
          )}

          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => openNote(note)}
              className={`glass-card !py-3 !px-4 cursor-pointer flex items-start gap-2 group ${
                selectedNote?.id === note.id ? '!border-primary-500/40 !bg-primary-950/20' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{note.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {format(new Date(note.updatedAt), 'dd MMM yyyy')}
                  {note.isAiGenerated && (
                    <span className="ml-1.5 text-purple-400">✦ AI</span>
                  )}
                </p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-900/40 text-primary-400">
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[10px] text-gray-600">+{note.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 mt-0.5 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Editor / Viewer */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden !p-0">
        {!selectedNote && editorMode === 'view' ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Edit2 size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Select a note to view</p>
              <p className="text-gray-600 text-sm mt-1">Or create a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Note header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              {editorMode === 'view' ? (
                <>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white truncate">{selectedNote?.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedNote?.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded bg-primary-900/40 text-primary-400">
                          <Tag size={8} /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={startEdit} className="btn-secondary text-xs px-3 py-2">
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => selectedNote && handleDelete(selectedNote.id)} className="btn-ghost text-xs px-3 py-2 text-red-400 hover:text-red-300">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note title..."
                    className="input-glass flex-1 text-base font-semibold !py-1.5 mr-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="btn-primary text-xs px-3 py-2">
                      <Save size={13} /> Save
                    </button>
                    <button onClick={() => { setEditorMode('view'); setSelectedNote(selectedNote); }} className="btn-ghost text-xs px-2 py-2">
                      <X size={15} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Tags editor (in edit mode) */}
            {editorMode !== 'view' && (
              <div className="px-6 py-2 border-b border-white/5">
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="Tags (comma-separated)..."
                  className="input-glass text-xs !py-1.5"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {editorMode === 'view' ? (
                <div className="markdown-content max-w-none">
                  <ReactMarkdown>{selectedNote?.content ?? ''}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full input-glass !rounded-lg font-mono text-sm resize-none leading-relaxed"
                  placeholder="Write your notes in Markdown..."
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* AI Generate Modal */}
      {generateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md animate-scale-in !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <h3 className="font-semibold text-white">Generate AI Notes</h3>
              </div>
              <button onClick={() => setGenerateModal(false)} className="btn-ghost px-2 py-1 text-gray-400">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Contest *</label>
                <select
                  value={genContestId}
                  onChange={(e) => setGenContestId(e.target.value)}
                  className="input-glass"
                >
                  <option value="">Select a contest...</option>
                  {contests.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#1a1f3a' }}>
                      [{c.platform}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Skill Level</label>
                <select
                  value={genSkill}
                  onChange={(e) => setGenSkill(e.target.value)}
                  className="input-glass"
                >
                  {['beginner', 'intermediate', 'advanced', 'expert'].map((s) => (
                    <option key={s} value={s} style={{ background: '#1a1f3a' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Additional context (optional)</label>
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="e.g. Focus on graph problems, I'm weak in segment trees..."
                  className="input-glass resize-none h-24"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!genContestId || generateNote.isPending}
                className="btn-primary w-full justify-center py-3"
              >
                {generateNote.isPending ? (
                  <><Sparkles size={15} className="animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles size={15} /> Generate Notes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
