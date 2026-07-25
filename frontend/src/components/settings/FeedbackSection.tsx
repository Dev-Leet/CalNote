import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Star, Send } from 'lucide-react';
import { feedbackApi, FeedbackCategory } from '../../api/feedback.api';

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Report a bug' },
  { value: 'feature-request', label: 'Request a feature' },
  { value: 'general', label: 'General feedback' },
  { value: 'praise', label: 'Something you liked' },
];

export function FeedbackSection() {
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      feedbackApi.submit({
        category,
        message: message.trim(),
        rating: rating ?? undefined,
        pageContext: 'settings',
      }),
    onSuccess: () => {
      setMessage('');
      setRating(null);
      setSavedMessage('Thanks — your feedback has been sent.');
      setTimeout(() => setSavedMessage(null), 4000);
    },
    onError: () => {
      setSavedMessage('Failed to send — please try again.');
      setTimeout(() => setSavedMessage(null), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-bg-surface p-5">
      <h2 className="m-0 text-base text-text-primary">Feedback</h2>
      <p className="m-0 text-xs text-text-secondary">
        Found a bug, want a feature, or just have thoughts? Let us know — it goes straight to the team.
      </p>

      {savedMessage && (
        <div
          className={`rounded-md px-3.5 py-2.5 text-[13px] text-bg-primary ${
            savedMessage.startsWith('Failed') ? 'bg-danger' : 'bg-success'
          }`}
        >
          {savedMessage}
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
        Type
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
          className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
        How would you rate your experience? <span className="text-text-secondary/60">(optional)</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(rating === star ? null : star)}
              aria-label={`Rate ${star} out of 5`}
              className="p-0.5"
            >
              <Star
                size={20}
                className={star <= (rating ?? 0) ? 'fill-warning text-warning' : 'text-text-secondary'}
              />
            </button>
          ))}
        </div>
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
        Message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Tell us what's on your mind…"
          className="w-full resize-y rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none"
        />
        <span className="self-end text-[11px] text-text-secondary">{message.length}/2000</span>
      </label>

      <button
        type="submit"
        disabled={isPending || !message.trim()}
        className={`flex items-center justify-center gap-1.5 self-start rounded-pill bg-accent-ashna px-5 py-2.5 text-sm font-semibold text-bg-primary ${
          isPending || !message.trim() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <Send size={14} />
        {isPending ? 'Sending…' : 'Send Feedback'}
      </button>
    </form>
  );
}

export default FeedbackSection;