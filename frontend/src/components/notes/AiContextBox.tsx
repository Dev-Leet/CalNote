import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, MessageSquare, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';
import { notesAiApi, NotesAiInstruction } from '../../api/notesAi.api';

interface AiContextBoxProps {
  selectedText: string;
  position: { top: number; left: number };
  onClose: () => void;
}

const PRESET_ACTIONS: { instruction: NotesAiInstruction; label: string; icon: typeof MessageSquare }[] = [
  { instruction: 'explain', label: 'Explain Code', icon: MessageSquare },
  { instruction: 'review_errors', label: 'Review for Errors', icon: AlertTriangle },
  { instruction: 'optimise', label: 'Optimise', icon: Sparkles },
];

/**
 * Floating popup anchored to a text/code selection inside NoteEditor. Offers
 * three preset actions plus a free-form question field, calling
 * POST /ai/notes/ask (Agent B — the Notes & Code Assistant system prompt).
 */
export function AiContextBox({ selectedText, position, onClose }: AiContextBoxProps) {
  const [customQuestion, setCustomQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: notesAiApi.ask,
    onSuccess: (data) => setAnswer(data.answer),
  });

  const handlePreset = (instruction: NotesAiInstruction) => {
    setAnswer(null);
    mutate({ selectedText, instruction });
  };

  const handleCustomAsk = () => {
    if (!customQuestion.trim()) return;
    setAnswer(null);
    mutate({ selectedText, instruction: 'custom', customQuestion: customQuestion.trim() });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000,
        width: '320px',
        padding: '16px',
        borderRadius: '14px',
        background: 'var(--color-bg-surface)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        border: '1px solid var(--color-bg-elevated)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Ashna AI</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {answer ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>
            {answer}
          </p>
          <button
            type="button"
            onClick={() => setAnswer(null)}
            style={{
              alignSelf: 'flex-start',
              fontSize: '12px',
              color: 'var(--color-accent-ashna)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Ask something else
          </button>
        </div>
      ) : isPending ? (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>Thinking…</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {PRESET_ACTIONS.map(({ instruction, label, icon: Icon }) => (
              <button
                key={instruction}
                type="button"
                onClick={() => handlePreset(instruction)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HelpCircle size={12} /> Custom question about selection:
            </span>
            <textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              rows={2}
              placeholder="e.g. Can I rewrite this without recursion?"
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </label>

          <button
            type="button"
            onClick={handleCustomAsk}
            disabled={!customQuestion.trim()}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '10px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--color-accent-ashna)',
              color: '#0B0F19',
              fontWeight: 600,
              fontSize: '13px',
              cursor: customQuestion.trim() ? 'pointer' : 'not-allowed',
              opacity: customQuestion.trim() ? 1 : 0.6,
            }}
          >
            Ask AI
          </button>
        </>
      )}
    </div>
  );
}

export default AiContextBox;