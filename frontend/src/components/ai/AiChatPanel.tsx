import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { useAiScheduleMutation, NormalizedAiEventResponse } from '../../queries/useAiScheduleMutation';
import { useAiProviderStore } from '../../stores/aiProviderStore';
import { useVoiceInput } from '../../hooks/useVoiceInput';
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
  const location = useLocation();
  const [promptValue, setPromptValue] = useState(() => (location.state as { draftPrompt?: string } | null)?.draftPrompt ?? '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const provider = useAiProviderStore((state) => state.provider);
  const { mutate, isPending } = useAiScheduleMutation();
  const { isSupported: isVoiceSupported, isListening, transcript, error: voiceError, startListening, stopListening, resetTranscript } = useVoiceInput();
  const lastVoiceModeRef = useRef(false);

  // Mirror the live transcript into the text input while listening, so the
  // user sees their speech transcribed in real time before it's sent —
  // matches how voice input UIs conventionally behave (visible feedback,
  // not a silent black box).
  useEffect(() => {
    if (isListening) {
      setPromptValue(transcript);
    }
  }, [transcript, isListening]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      return;
    }
    resetTranscript();
    lastVoiceModeRef.current = true;
    startListening();
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promptValue.trim();
    if (!trimmed || isPending) return;

    const wasVoice = lastVoiceModeRef.current;
    lastVoiceModeRef.current = false;

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', text: trimmed },
      { id: assistantMessageId, role: 'assistant', text: 'Generating schedule…', status: 'pending' },
    ]);
    setPromptValue('');
    resetTranscript();

    mutate(
      { prompt: trimmed, inputMode: wasVoice ? 'voice' : 'text' },
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
      <div className="flex items-center justify-between border-b border-border-subtle px-3.5 py-2.5">
        <span className="text-[13px] font-semibold text-text-primary">AI Chat</span>
        <span className="rounded-pill bg-bg-elevated px-2.5 py-1 text-[11px] text-text-secondary">
          Using: <span className="font-semibold text-text-primary">{provider === 'ashna' ? 'Ashna AI' : 'Custom AI Agent'}</span>
        </span>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-text-secondary">
            Ask {provider === 'ashna' ? 'Ashna AI' : 'your Custom AI Agent'} to schedule something —
            e.g. "Block 2 hours every weekday evening for DSA practice, note: focus on graphs this week."
            {' '}Change your AI provider anytime in{' '}
            <a href="/settings" className="text-accent-ashna underline">
              Settings
            </a>
            .
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

      {voiceError && (
        <p className="border-t border-border-subtle px-3.5 pt-2 text-xs text-danger">{voiceError}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border-subtle p-3">
        {isVoiceSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isPending}
            title={isListening ? 'Stop listening' : 'Speak your request'}
            aria-pressed={isListening}
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
              isListening ? 'animate-pulse bg-danger text-bg-primary' : 'bg-bg-elevated text-text-secondary'
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        <input
          type="text"
          value={promptValue}
          onChange={(e) => {
            lastVoiceModeRef.current = false;
            setPromptValue(e.target.value);
          }}
          placeholder={isListening ? 'Listening…' : 'Ask the AI to schedule something…'}
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