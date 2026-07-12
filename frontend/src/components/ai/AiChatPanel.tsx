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
  jobId?: string;
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
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId ? { ...m, text: '', status: 'queued', jobId: result.jobId } : m,
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
    <div className="flex h-full flex-col overflow-hidden rounded-md bg-bg-surface">
      <div className="border-b border-border-subtle p-3">
        <AiProviderSwitch compact />
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-text-secondary">
            Ask {provider === 'ashna' ? 'Ashna AI' : 'your Custom AI Agent'} to schedule something —
            e.g. "Block 2 hours every weekday evening for DSA practice, note: focus on graphs this week."
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] min-w-0 ${message.role === 'user' ? 'self-end' : 'self-start'}`}
          >
            {message.status === 'queued' && message.jobId ? (
              <div className="rounded-md bg-bg-elevated px-3.5 py-2.5">
                <AiJobStatusIndicator jobId={message.jobId} onComplete={() => handleJobComplete(message.id)} />
              </div>
            ) : (
              <div
                className={`rounded-md px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap ${
                  message.role === 'user' ? 'bg-accent-ashna text-bg-primary' : 'bg-bg-elevated text-text-primary'
                } ${message.status === 'pending' ? 'opacity-70' : ''}`}
              >
                {message.text}
              </div>
            )}
            {message.reasoning && (
              <p className="mt-1.5 text-xs italic text-text-secondary">{message.reasoning}</p>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border-subtle p-3">
        <input
          type="text"
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          placeholder="Ask the AI to schedule something…"
          disabled={isPending}
          className="flex-1 rounded-pill bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !promptValue.trim()}
          className={`rounded-pill bg-accent-ashna px-4.5 py-2.5 text-sm font-semibold text-bg-primary ${
            isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default AiChatPanel;