import { DateTime } from 'luxon';

/**
 * Central timezone utility. Enforces Asia/Kolkata (IST, UTC+5:30) at every
 * API boundary, per SRS constraint 3.4.3. All DB storage remains UTC —
 * conversion happens ONLY here, never ad hoc in controllers/services.
 */
export const IST_ZONE = 'Asia/Kolkata';

/**
 * Converts a UTC Date (as stored in MongoDB) to an ISO 8601 string with
 * the +05:30 IST offset, for API responses and AI context payloads.
 */
export function toIST(date: Date): string {
  return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(IST_ZONE).toISO() as string;
}

/**
 * Parses an incoming IST (or any offset-qualified) ISO string from a client
 * or AI provider response into a UTC Date for storage.
 */
export function fromISTStringToUTCDate(isoString: string): Date {
  const parsed = DateTime.fromISO(isoString, { setZone: true });
  if (!parsed.isValid) {
    throw new Error(`Invalid ISO datetime string: ${isoString} (${parsed.invalidReason})`);
  }
  return parsed.toUTC().toJSDate();
}

/**
 * Current server time expressed in IST, ISO 8601 with offset —
 * used as `currentDateTimeIST` in SchedulingContext for AI providers.
 */
export function nowInIST(): string {
  return DateTime.now().setZone(IST_ZONE).toISO() as string;
}

/**
 * Formats a UTC Date as a human-readable IST string (for logs/notifications),
 * e.g. "09 Jul 2026, 18:00 IST".
 */
export function formatISTHumanReadable(date: Date): string {
  return DateTime.fromJSDate(date, { zone: 'utc' })
    .setZone(IST_ZONE)
    .toFormat("dd LLL yyyy, HH:mm 'IST'");
}

/**
 * Returns true if two [start, end) UTC date ranges overlap.
 * Used by event.service.ts conflict detection — timezone-agnostic since
 * both inputs are already normalized UTC Dates at this point.
 */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
