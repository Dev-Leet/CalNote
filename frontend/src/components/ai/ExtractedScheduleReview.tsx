import { useMemo, useState } from 'react';
import { Calendar, AlertCircle, X } from 'lucide-react';
import { ExtractedScheduleItem } from '../../api/extraction.api';
import { resolveDayToDate } from '../../utils/resolveDayToDate';

export interface ReviewRow extends ExtractedScheduleItem {
  resolvedDate: Date | null;
  /** Editable start/end time as HH:mm, seeded from a best-effort parse of
   *  the extracted `time` field where possible, else a sensible default. */
  startTime: string;
  endTime: string;
  include: boolean;
}

interface ExtractedScheduleReviewProps {
  items: ExtractedScheduleItem[];
  onConfirm: (rows: ReviewRow[]) => void;
  onCancel: () => void;
  isCreating: boolean;
}

/** Best-effort extraction of a start time from strings like "9:00 AM - 1:00 PM"
 *  or "9:00 AM" — falls back to a default if nothing parseable is found,
 *  since the user can edit any row before confirming anyway. */
function guessStartTime(timeText: string): string {
  const match = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '09:00';
  let hours = Number(match[1]);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

export function ExtractedScheduleReview({ items, onConfirm, onCancel, isCreating }: ExtractedScheduleReviewProps) {
  const [rows, setRows] = useState<ReviewRow[]>(() =>
    items.map((item) => {
      const start = guessStartTime(item.time);
      const [h, m] = start.split(':').map(Number);
      const endH = (h + 1) % 24;
      return {
        ...item,
        resolvedDate: resolveDayToDate(item.day),
        startTime: start,
        endTime: `${String(endH).padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        include: true,
      };
    }),
  );

  const includedCount = useMemo(() => rows.filter((r) => r.include).length, [rows]);

  const updateRow = (index: number, patch: Partial<ReviewRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-bg-surface p-4">
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-accent-ashna" />
        <h3 className="m-0 text-sm font-semibold text-text-primary">
          Review extracted schedule ({items.length} item{items.length === 1 ? '' : 's'})
        </h3>
      </div>
      <p className="m-0 text-xs text-text-secondary">
        Days are mapped to the next matching calendar date. Check the dates and times below, uncheck anything you
        don't want added, then confirm.
      </p>

      <div className="flex flex-col gap-2 overflow-x-auto">
        {rows.map((row, index) => (
          <div
            key={index}
            className={`rounded-md border px-3 py-2.5 ${row.include ? 'border-accent-ashna/40 bg-accent-ashna-tint' : 'border-border-subtle bg-bg-elevated opacity-60'}`}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={row.include}
                onChange={(e) => updateRow(index, { include: e.target.checked })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-text-primary">{row.event}</span>
                  <span className="rounded-pill bg-bg-primary px-2 py-0.5 text-[10px] text-text-secondary">{row.day}</span>
                  {row.attendance !== 'N/A' && (
                    <span className="rounded-pill bg-warning-tint px-2 py-0.5 text-[10px] text-warning">{row.attendance}</span>
                  )}
                </div>

                {!row.resolvedDate && (
                  <p className="m-0 mt-1 flex items-center gap-1 text-[11px] text-danger">
                    <AlertCircle size={11} /> Couldn't recognize "{row.day}" as a weekday — this item will be
                    skipped unless you fix the date manually elsewhere.
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={row.resolvedDate ? row.resolvedDate.toISOString().slice(0, 10) : ''}
                    onChange={(e) =>
                      updateRow(index, { resolvedDate: e.target.value ? new Date(e.target.value) : null })
                    }
                    className="rounded-sm bg-bg-primary px-2 py-1 text-xs text-text-primary"
                  />
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(e) => updateRow(index, { startTime: e.target.value })}
                    className="rounded-sm bg-bg-primary px-2 py-1 text-xs text-text-primary"
                  />
                  <span className="text-xs text-text-secondary">to</span>
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={(e) => updateRow(index, { endTime: e.target.value })}
                    className="rounded-sm bg-bg-primary px-2 py-1 text-xs text-text-primary"
                  />
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-text-secondary">
                  {row.dress_code !== 'N/A' && <span>Dress: {row.dress_code}</span>}
                  {row.location !== 'N/A' && <span>Location: {row.location}</span>}
                  {row.notes !== 'N/A' && <span>Note: {row.notes}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
        <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-pill bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary">
          <X size={13} /> Discard
        </button>
        <button
          type="button"
          onClick={() => onConfirm(rows)}
          disabled={isCreating || includedCount === 0}
          className={`rounded-pill bg-accent-ashna px-4 py-1.5 text-xs font-semibold text-bg-primary ${
            isCreating || includedCount === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {isCreating ? 'Adding…' : `Add ${includedCount} Event${includedCount === 1 ? '' : 's'} to Calendar`}
        </button>
      </div>
    </div>
  );
}

export default ExtractedScheduleReview;