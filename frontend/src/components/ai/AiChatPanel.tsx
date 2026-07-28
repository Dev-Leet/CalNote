import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, MicOff, ClipboardPaste } from 'lucide-react';
import { useAiScheduleMutation, NormalizedAiEventResponse } from '../../queries/useAiScheduleMutation';
import { useAiProviderStore } from '../../stores/aiProviderStore';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { AiJobStatusIndicator } from './AiJobStatusIndicator';
import { extractionApi, ExtractedScheduleItem } from '../../api/extraction.api';
import { eventsApi } from '../../api/events.api';
import { ExtractedScheduleReview, ReviewRow } from './ExtractedScheduleReview';

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
  const [extractedItems, setExtractedItems] = useState<ExtractedScheduleItem[]>([]);
  const [showExtractedReview, setShowExtractedReview] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const provider = useAiProviderStore((state) => state.provider);
  const { mutate, isPending } = useAiScheduleMutation();
  const { isSupported: isVoiceSupported, isListening, transcript, error: voiceError, startListening, stopListening, resetTranscript } = useVoiceInput();
  const lastVoiceModeRef = useRef(false);

  const { mutate: createEvents, isPending: isCreatingEvents } = useMutation({
    mutationFn: async (rows: ReviewRow[]) => {
      const toCreate = rows.filter((r) => r.include && r.resolvedDate);
      const results = await Promise.allSettled(
        toCreate.map((r) => {
          const start = new Date(r.resolvedDate as Date);
          const [sh, sm] = r.startTime.split(':').map(Number);
          start.setHours(sh, sm, 0, 0);
          const end = new Date(r.resolvedDate as Date);
          const [eh, em] = r.endTime.split(':').map(Number);
          end.setHours(eh, em, 0, 0);
          if (end <= start) end.setDate(end.getDate() + 1); // handles an overnight-spanning entry

          return eventsApi.create({
            title: r.event,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            force: true, // user already reviewed and confirmed each row explicitly
          });
        }),
      );
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      const failedCount = results.filter((r) => r.status === 'rejected').length;
      setShowExtractedReview(false);
      setExtractedItems([]);
      const assistantMessageId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          text:
            failedCount === 0
              ? `Added ${results.length} event${results.length === 1 ? '' : 's'} to your calendar.`
              : `Added ${results.length - failedCount} of ${results.length} events — ${failedCount} failed to save.`,
        },
      ]);
    },
  });

  const handleExtractFromClipboard = async () => {
    const text = window.prompt('Paste the text you want to extract a schedule from:');
    if (!text?.trim()) return;

    setExtractError(null);
    setIsExtracting(true);
    try {
      const { items } = await extractionApi.extractSchedule(text.trim());
      if (items.length === 0) {
        setExtractError("No day-based schedule was found in that text — nothing to extract.");
        return;
      }
      setExtractedItems(items);
      setShowExtractedReview(true);
    } catch {
      setExtractError('Extraction failed. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

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
    // h-full here resolves against the fixed h-[320px]/h-[400px] parent
    // from CalendarPage rather than an ambiguous flex-1 chain — this is
    // what makes the panel's height deterministic instead of a byproduct
    // of sibling content.
    <div className="flex h-full flex-col overflow-hidden rounded-md bg-bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border-subtle px-3.5 py-2.5">
        <span className="text-[13px] font-semibold text-text-primary">AI Chat</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExtractFromClipboard}
            disabled={isExtracting}
            title="Paste unstructured text (e.g. an email or notice) to extract a schedule from it"
            className={`flex items-center gap-1 rounded-pill bg-accent-ashna-tint px-2.5 py-1 text-[11px] font-semibold text-accent-ashna ${
              isExtracting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            <ClipboardPaste size={12} />
            {isExtracting ? 'Extracting…' : 'Extract from Text'}
          </button>
          <span className="whitespace-nowrap rounded-pill bg-bg-elevated px-2.5 py-1 text-[11px] text-text-secondary">
            Using: <span className="font-semibold text-text-primary">{provider === 'ashna' ? 'Ashna AI' : 'Custom AI Agent'}</span>
          </span>
        </div>
      </div>

      {extractError && (
        <div className="border-b border-border-subtle px-3.5 py-2">
          <p className="m-0 text-xs text-danger">{extractError}</p>
        </div>
      )}

      {showExtractedReview && (
        <div className="border-b border-border-subtle p-3.5">
          <ExtractedScheduleReview
            items={extractedItems}
            onConfirm={(rows) => createEvents(rows)}
            onCancel={() => setShowExtractedReview(false)}
            isCreating={isCreatingEvents}
          />
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 border-t border-border-subtle p-3 sm:flex-nowrap">
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