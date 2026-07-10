/**
 * Centralized formatting helpers. Consolidates the inline
 * `toLocaleString('en-IN', {...})` calls that were previously duplicated
 * across ContestCard, EventDetailPopover, CalendarGrid, etc.
 */

const IST_DATE_TIME_OPTS: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
const IST_TIME_ONLY_OPTS: Intl.DateTimeFormatOptions = { timeStyle: 'short' };
const IST_DATE_ONLY_OPTS: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

export function formatISTDateTime(isoString: string | Date): string {
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
  return date.toLocaleString('en-IN', IST_DATE_TIME_OPTS);
}

export function formatISTTime(isoString: string | Date): string {
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
  return date.toLocaleTimeString('en-IN', IST_TIME_ONLY_OPTS);
}

export function formatISTDate(isoString: string | Date): string {
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
  return date.toLocaleDateString('en-IN', IST_DATE_ONLY_OPTS);
}

export function formatEventRange(start: string | Date, end: string | Date): string {
  return `${formatISTDateTime(start)} \u2013 ${formatISTTime(end)} IST`;
}

/**
 * Formats a duration in minutes as a compact human-readable string,
 * e.g. 90 -> "1h 30m", 45 -> "45m", 180 -> "3h".
 */
export function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Compact countdown label for a future ISO datetime, e.g. "2d 4h", "45m", "Live / Started".
 * Shared logic behind ContestCard's useCountdown hook.
 */
export function formatCountdown(targetIso: string, nowMs: number = Date.now()): string {
  const diffMs = new Date(targetIso).getTime() - nowMs;
  if (diffMs <= 0) return 'Live / Started';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Truncates a string to a max length with an ellipsis, for compact UI contexts
 * (e.g. event chip titles on narrow calendar cells).
 */
export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}\u2026`;
}