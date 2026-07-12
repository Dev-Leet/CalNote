import React, { useState } from 'react';
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
      style={{ top: position.top, left: position.left }}
      className="absolute z-[1000] w-80 rounded-lg border border-bg-elevated bg-bg-surface p-4 shadow-elevated"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-bold text-text-primary">Ashna AI</span>
        <button type="button" onClick={onClose} aria-label="Close" className="text-text-secondary">
          <X size={16} />
        </button>
      </div>

      {answer ? (
        <div className="flex flex-col gap-2.5">
          <p className="m-0 whitespace-pre-wrap text-[13px] text-text-primary">{answer}</p>
          <button
            type="button"
            onClick={() => setAnswer(null)}
            className="self-start p-0 text-xs text-accent-ashna"
          >
            Ask something else
          </button>
        </div>
      ) : isPending ? (
        <p className="m-0 text-[13px] text-text-secondary">Thinking…</p>
      ) : (
        <>
          <div className="mb-3.5 flex flex-col gap-1.5">
            {PRESET_ACTIONS.map(({ instruction, label, icon: Icon }) => (
              <button
                key={instruction}
                type="button"
                onClick={() => handlePreset(instruction)}
                className="flex items-center gap-2 rounded-md bg-bg-elevated px-3 py-2.5 text-left text-[13px] text-text-primary"
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <HelpCircle size={12} /> Custom question about selection:
            </span>
            <textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              rows={2}
              placeholder="e.g. Can I rewrite this without recursion?"
              className="resize-y rounded-md bg-bg-elevated px-2.5 py-2 text-[13px] text-text-primary"
            />
          </label>

          <button
            type="button"
            onClick={handleCustomAsk}
            disabled={!customQuestion.trim()}
            className={`mt-2.5 w-full rounded-pill bg-accent-ashna py-2.5 text-[13px] font-semibold text-bg-primary ${
              customQuestion.trim() ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
            }`}
          >
            Ask AI
          </button>
        </>
      )}
    </div>
  );
}

export default AiContextBox;