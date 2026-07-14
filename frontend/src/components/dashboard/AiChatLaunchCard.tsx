import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardCard } from './DashboardCard';

/**
 * Lightweight launch card, not a full embedded AiChatPanel — typing a
 * prompt here and hitting send navigates to /calendar with the draft
 * preserved (via router state), where the real AiChatPanel picks it up.
 * Avoids running a second live chat session/mutation state at dashboard
 * scale for a page whose job is overview + navigate.
 */
export function AiChatLaunchCard() {
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/calendar', { state: { draftPrompt: draft } });
  };

  return (
    <DashboardCard title="Ask Ashna" icon={MessageSquare} viewAllHref="/calendar" viewAllLabel="Open chat">
      <p className="mb-3 text-[13px] text-text-secondary">
        Quickly ask the AI to schedule something — it'll open the full chat with your prompt ready to go.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Block 2 hours tomorrow for DSA practice…"
          className="flex-1 rounded-pill bg-bg-elevated px-3.5 py-2 text-[13px] text-text-primary outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className={`flex items-center justify-center rounded-pill bg-accent-ashna px-3.5 ${
            draft.trim() ? '' : 'cursor-not-allowed opacity-60'
          }`}
        >
          <Send size={14} className="text-bg-primary" />
        </button>
      </form>
    </DashboardCard>
  );
}

export default AiChatLaunchCard;