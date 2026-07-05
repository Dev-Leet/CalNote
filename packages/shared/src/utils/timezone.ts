// packages/shared/src/utils/timezone.ts
// Timezone conversion utilities for IST (Indian Standard Time)

export const IST_TIMEZONE = 'Asia/Kolkata';
export const IST_OFFSET_MINUTES = 330; // UTC+5:30

/**
 * Convert UTC date to IST
 */
export function toIST(date: Date | string): Date {
  const utcDate = new Date(date);
  return new Date(utcDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
}

/**
 * Convert IST date to UTC
 */
export function fromIST(date: Date | string): Date {
  const istDate = new Date(date);
  return new Date(istDate.getTime() - IST_OFFSET_MINUTES * 60 * 1000);
}

/**
 * Format date for display in IST
 */
export function formatIST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const utcDate = new Date(date);
  return utcDate.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    ...options,
  });
}

/**
 * Get a human-readable countdown string
 * e.g. "Starts in 2h 30m" or "Started 15m ago"
 */
export function getCountdown(startTime: Date | string): string {
  const now = new Date();
  const start = new Date(startTime);
  const diffMs = start.getTime() - now.getTime();

  if (diffMs <= 0) {
    const pastMs = Math.abs(diffMs);
    const pastMins = Math.floor(pastMs / 60000);
    if (pastMins < 60) return `Started ${pastMins}m ago`;
    const pastHours = Math.floor(pastMins / 60);
    if (pastHours < 24) return `Started ${pastHours}h ago`;
    return `Started ${Math.floor(pastHours / 24)}d ago`;
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Starts in ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    const remMins = diffMins % 60;
    return remMins > 0
      ? `Starts in ${diffHours}h ${remMins}m`
      : `Starts in ${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;
  return remHours > 0
    ? `Starts in ${diffDays}d ${remHours}h`
    : `Starts in ${diffDays}d`;
}

/**
 * Check if a contest is live right now
 */
export function isLive(startTime: Date | string, endTime: Date | string): boolean {
  const now = new Date();
  return new Date(startTime) <= now && now <= new Date(endTime);
}

/**
 * Check if a contest is upcoming (not yet started)
 */
export function isUpcoming(startTime: Date | string): boolean {
  return new Date(startTime) > new Date();
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
