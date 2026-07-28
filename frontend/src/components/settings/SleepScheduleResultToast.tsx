
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { SleepScheduleResult } from '../../api/events.api';

interface SleepScheduleResultToastProps {
  result: SleepScheduleResult;
  onDismiss: () => void;
}

export function SleepScheduleResultToast({ result, onDismiss }: SleepScheduleResultToastProps) {
  const hasSkips = result.skipped.length > 0;

  return (
    <div className={`flex items-start gap-2 rounded-md px-3.5 py-3 text-xs ${hasSkips ? 'bg-warning-tint' : 'bg-success-tint'}`}>
      {hasSkips ? (
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-warning" />
      ) : (
        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-success" />
      )}
      <div className="flex-1">
        <p className="m-0 text-text-primary">
          Scheduled {result.created} night{result.created === 1 ? '' : 's'} of sleep
          {result.alreadyExisted > 0 ? ` (${result.alreadyExisted} already scheduled, left unchanged)` : ''}.
        </p>
        {hasSkips && (
          <ul className="m-0 mt-1.5 list-disc pl-4 text-text-secondary">
            {result.skipped.map((s) => (
              <li key={s.date}>
                {s.date}: {s.reason}
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={onDismiss} className="mt-1.5 p-0 text-[11px] text-text-secondary underline">
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default SleepScheduleResultToast;