import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// apps/web/src/pages/NotesPage.tsx
// Notes management with list, editor, and AI generation
import { useState } from 'react';
import { Plus, Sparkles, Trash2, Edit2, Save, X, Tag, ChevronRight } from 'lucide-react';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useGenerateNote } from '../hooks/useNotes';
import { useUpcomingContests } from '../hooks/useContests';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
export default function NotesPage() {
    const [selectedNote, setSelectedNote] = useState(null);
    const [editorMode, setEditorMode] = useState('view');
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
    const openNote = (note) => {
        setSelectedNote(note);
        setEditorMode('view');
    };
    const startEdit = () => {
        if (!selectedNote)
            return;
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
        }
        else if (editorMode === 'edit' && selectedNote) {
            const note = await updateNote.mutateAsync({ id: selectedNote.id, title: editTitle, content: editContent, tags });
            setSelectedNote(note);
            setEditorMode('view');
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this note?'))
            return;
        await deleteNote.mutateAsync(id);
        if (selectedNote?.id === id) {
            setSelectedNote(null);
            setEditorMode('view');
        }
    };
    const handleGenerate = async () => {
        const note = await generateNote.mutateAsync({ contestId: genContestId, userPrompt: genPrompt || undefined, skillLevel: genSkill });
        setGenerateModal(false);
        setSelectedNote(note);
        setEditorMode('view');
    };
    return (_jsxs("div", { className: "flex gap-6 h-[calc(100vh-10rem)] animate-fade-in", children: [_jsxs("div", { className: "w-72 flex-shrink-0 flex flex-col gap-3", children: [_jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: startCreate, className: "btn-primary flex-1 text-sm justify-center py-2", children: [_jsx(Plus, { size: 15 }), " New Note"] }), _jsx("button", { onClick: () => setGenerateModal(true), className: "btn-secondary text-sm px-3 py-2", title: "AI Generate", children: _jsx(Sparkles, { size: 15, className: "text-purple-400" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto space-y-2", children: [isLoading && [...Array(4)].map((_, i) => (_jsxs("div", { className: "glass-card h-16 animate-pulse !p-3", children: [_jsx("div", { className: "h-3 bg-white/5 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-2 bg-white/5 rounded w-1/2" })] }, i))), !isLoading && notes.length === 0 && (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(Edit2, { size: 28, className: "mx-auto mb-3 opacity-40" }), _jsx("p", { className: "text-sm", children: "No notes yet" }), _jsx("p", { className: "text-xs mt-1", children: "Create or AI-generate one" })] })), notes.map((note) => (_jsxs("div", { onClick: () => openNote(note), className: `glass-card !py-3 !px-4 cursor-pointer flex items-start gap-2 group ${selectedNote?.id === note.id ? '!border-primary-500/40 !bg-primary-950/20' : ''}`, children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white truncate", children: note.title }), _jsxs("p", { className: "text-[11px] text-gray-500 mt-0.5", children: [format(new Date(note.updatedAt), 'dd MMM yyyy'), note.isAiGenerated && (_jsx("span", { className: "ml-1.5 text-purple-400", children: "\u2726 AI" }))] }), note.tags.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1 mt-1.5", children: [note.tags.slice(0, 2).map((tag) => (_jsx("span", { className: "text-[10px] px-1.5 py-0.5 rounded bg-primary-900/40 text-primary-400", children: tag }, tag))), note.tags.length > 2 && (_jsxs("span", { className: "text-[10px] text-gray-600", children: ["+", note.tags.length - 2] }))] }))] }), _jsx(ChevronRight, { size: 14, className: "text-gray-600 group-hover:text-gray-400 mt-0.5 flex-shrink-0" })] }, note.id)))] })] }), _jsx("div", { className: "flex-1 flex flex-col glass-card overflow-hidden !p-0", children: !selectedNote && editorMode === 'view' ? (_jsx("div", { className: "flex-1 flex items-center justify-center text-center", children: _jsxs("div", { children: [_jsx(Edit2, { size: 48, className: "text-gray-700 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500 font-medium", children: "Select a note to view" }), _jsx("p", { className: "text-gray-600 text-sm mt-1", children: "Or create a new one" })] }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center justify-between px-6 py-4 border-b border-white/5", children: editorMode === 'view' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h2", { className: "text-lg font-semibold text-white truncate", children: selectedNote?.title }), _jsx("div", { className: "flex items-center gap-2 mt-0.5", children: selectedNote?.tags.map((tag) => (_jsxs("span", { className: "inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded bg-primary-900/40 text-primary-400", children: [_jsx(Tag, { size: 8 }), " ", tag] }, tag))) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: startEdit, className: "btn-secondary text-xs px-3 py-2", children: [_jsx(Edit2, { size: 13 }), " Edit"] }), _jsx("button", { onClick: () => selectedNote && handleDelete(selectedNote.id), className: "btn-ghost text-xs px-3 py-2 text-red-400 hover:text-red-300", children: _jsx(Trash2, { size: 13 }) })] })] })) : (_jsxs(_Fragment, { children: [_jsx("input", { value: editTitle, onChange: (e) => setEditTitle(e.target.value), placeholder: "Note title...", className: "input-glass flex-1 text-base font-semibold !py-1.5 mr-3" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: handleSave, className: "btn-primary text-xs px-3 py-2", children: [_jsx(Save, { size: 13 }), " Save"] }), _jsx("button", { onClick: () => { setEditorMode('view'); setSelectedNote(selectedNote); }, className: "btn-ghost text-xs px-2 py-2", children: _jsx(X, { size: 15 }) })] })] })) }), editorMode !== 'view' && (_jsx("div", { className: "px-6 py-2 border-b border-white/5", children: _jsx("input", { value: editTags, onChange: (e) => setEditTags(e.target.value), placeholder: "Tags (comma-separated)...", className: "input-glass text-xs !py-1.5" }) })), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: editorMode === 'view' ? (_jsx("div", { className: "markdown-content max-w-none", children: _jsx(ReactMarkdown, { children: selectedNote?.content ?? '' }) })) : (_jsx("textarea", { value: editContent, onChange: (e) => setEditContent(e.target.value), className: "w-full h-full input-glass !rounded-lg font-mono text-sm resize-none leading-relaxed", placeholder: "Write your notes in Markdown..." })) })] })) }), generateModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", style: { background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }, children: _jsxs("div", { className: "glass-card w-full max-w-md animate-scale-in !p-0 overflow-hidden", children: [_jsxs("div", { className: "px-6 py-4 border-b border-white/5 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sparkles, { size: 18, className: "text-purple-400" }), _jsx("h3", { className: "font-semibold text-white", children: "Generate AI Notes" })] }), _jsx("button", { onClick: () => setGenerateModal(false), className: "btn-ghost px-2 py-1 text-gray-400", children: _jsx(X, { size: 15 }) })] }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 mb-1.5 block", children: "Contest *" }), _jsxs("select", { value: genContestId, onChange: (e) => setGenContestId(e.target.value), className: "input-glass", children: [_jsx("option", { value: "", children: "Select a contest..." }), contests.map((c) => (_jsxs("option", { value: c.id, style: { background: '#1a1f3a' }, children: ["[", c.platform, "] ", c.name] }, c.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 mb-1.5 block", children: "Skill Level" }), _jsx("select", { value: genSkill, onChange: (e) => setGenSkill(e.target.value), className: "input-glass", children: ['beginner', 'intermediate', 'advanced', 'expert'].map((s) => (_jsx("option", { value: s, style: { background: '#1a1f3a' }, children: s.charAt(0).toUpperCase() + s.slice(1) }, s))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 mb-1.5 block", children: "Additional context (optional)" }), _jsx("textarea", { value: genPrompt, onChange: (e) => setGenPrompt(e.target.value), placeholder: "e.g. Focus on graph problems, I'm weak in segment trees...", className: "input-glass resize-none h-24" })] }), _jsx("button", { onClick: handleGenerate, disabled: !genContestId || generateNote.isPending, className: "btn-primary w-full justify-center py-3", children: generateNote.isPending ? (_jsxs(_Fragment, { children: [_jsx(Sparkles, { size: 15, className: "animate-spin" }), " Generating..."] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { size: 15 }), " Generate Notes"] })) })] })] }) }))] }));
}
//# sourceMappingURL=NotesPage.js.map