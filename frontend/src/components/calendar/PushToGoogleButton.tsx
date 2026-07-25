import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { eventsApi } from '../../api/events.api';

/**
 * Bulk-push button — only pushes events that don't yet have a
 * googleCalendarEventId (see pushAllUnsyncedEvents's server-side logic).
 * Surfaces a real per-run summary rather than a bare "done" toast, since a
 * partial failure across dozens of events genuinely needs to be visible,
 * not swallowed.
 */
export function PushToGoogleButton() {
  const queryClient = useQueryClient();
  const [showResult, setShowResult] = useState(false);

  const { mutate, data, isPending, error } = useMutation({
    mutationFn: eventsApi.pushAllToGoogle,
    onSuccess: () => {
      setShowResult(true);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-range'] });
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => mutate()}
        disabled={isPending}
        className={`flex items-center justify-center gap-2 rounded-pill bg-bg-elevated px-4 py-2 text-[13px] font-semibold text-text-primary ${
          isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <UploadCloud size={15} />
        {isPending ? 'Pushing to Google Calendar…' : 'Push All to Google Calendar'}
      </button>

      {error && (
        <p className="m-0 text-xs text-danger">Push failed to start. Please try again.</p>
      )}

      {showResult && data && (
        <div
          className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-xs ${
            data.failed.length === 0 ? 'bg-success-tint' : 'bg-warning-tint'
          }`}
        >
          {data.failed.length === 0 ? (
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-success" />
          ) : (
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-warning" />
          )}
          <div className="flex-1">
            <p className="m-0 text-text-primary">
              {data.total === 0
                ? 'Everything is already synced — nothing new to push.'
                : `Pushed ${data.pushed} of ${data.total} events.`}
            </p>
            {data.failed.length > 0 && (
              <ul className="m-0 mt-1.5 list-disc pl-4 text-text-secondary">
                {data.failed.slice(0, 5).map((f) => (
                  <li key={f.eventId}>
                    {f.title}: {f.error}
                  </li>
                ))}
                {data.failed.length > 5 && <li>…and {data.failed.length - 5} more</li>}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PushToGoogleButton;