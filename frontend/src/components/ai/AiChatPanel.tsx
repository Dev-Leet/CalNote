import React, { useState, useRef, useEffect } from 'react';
import { useAiScheduleMutation, NormalizedAiEventResponse } from '../../queries/useAiScheduleMutation';
import { useAiProviderStore } from '../../stores/aiProviderStore';
import { AiProviderSwitch } from './AiProviderSwitch';
import { AiJobStatusIndicator } from './AiJobStatusIndicator';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  reasoning?: string;
  status?: 'pending' | 'error' | 'queued';
  jobId?: string; // set when the backend responded 202 and handed off to the async queue
}

export function AiChatPanel() {
  const [promptValue, setPromptValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const provider = useAiProviderStore((state) => state.provider);
  const { mutate, isPending } = useAiScheduleMutation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promptValue.trim();
    if (!trimmed || isPending) return;

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', text: trimmed },
      { id: assistantMessageId, role: 'assistant', text: 'Generating schedule…', status: 'pending' },
    ]);
    setPromptValue('');

    mutate(
      { prompt: trimmed },
      {
        onSuccess: (result) => {
          if (result.status === 'complete') {
            replaceAssistantMessage(assistantMessageId, formatEventResponse(result.data), result.data.reasoning);
          } else {
            // 202 path: attach the jobId so AiJobStatusIndicator can take over
            // polling and update this same message once the job resolves.
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, text: '', status: 'queued', jobId: result.jobId }
                  : m,
              ),
            );
          }
        },
        onError: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, text: 'Something went wrong generating that schedule. Please try again.', status: 'error' }
                : m,
            ),
          );
        },
      },
    );
  };

  const replaceAssistantMessage = (id: string, text: string, reasoning?: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text, reasoning, status: undefined, jobId: undefined } : m)),
    );
  };

  const handleJobComplete = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, text: 'Schedule ready — check your calendar.', status: undefined, jobId: undefined }
          : m,
      ),
    );
  };

  const formatEventResponse = (data: NormalizedAiEventResponse): string => {
    if (data.events.length === 0) return "I couldn't generate any events from that prompt.";
    if (data.events.length === 1) return `Scheduled: ${data.events[0].title}`;
    return `Scheduled ${data.events.length} events, starting with "${data.events[0].title}"`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg-surface)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-bg-elevated)' }}>
        <AiProviderSwitch compact />
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Ask {provider === 'ashna' ? 'Ashna AI' : 'your Custom AI Agent'} to schedule something —
            e.g. "Block 2 hours every weekday evening for DSA practice, note: focus on graphs this week."
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              minWidth: 0,
            }}
          >
            {message.status === 'queued' && message.jobId ? (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'var(--color-bg-elevated)',
                }}
              >
                <AiJobStatusIndicator jobId={message.jobId} onComplete={() => handleJobComplete(message.id)} />
              </div>
            ) : (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: message.role === 'user' ? 'var(--color-accent-ashna)' : 'var(--color-bg-elevated)',
                  color: message.role === 'user' ? '#0B0F19' : 'var(--color-text-primary)',
                  fontSize: '14px',
                  opacity: message.status === 'pending' ? 0.7 : 1,
                  // The actual fix: whiteSpace preserves user line breaks
                  // (so pasted multi-line prompts still look right) while
                  // still wrapping; overflowWrap/wordBreak force a break
                  // even mid-word for unbroken strings like long URLs.
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                {message.text}
              </div>
            )}
            {message.reasoning && (
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                {message.reasoning}
              </p>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid var(--color-bg-elevated)' }}>
        <input
          type="text"
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          placeholder="Ask the AI to schedule something…"
          disabled={isPending}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '9999px',
            border: 'none',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            fontSize: '14px',
          }}
        />
        <button
          type="submit"
          disabled={isPending || !promptValue.trim()}
          style={{
            padding: '10px 18px',
            borderRadius: '9999px',
            border: 'none',
            background: 'var(--color-accent-ashna)',
            color: '#0B0F19',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default AiChatPanel;