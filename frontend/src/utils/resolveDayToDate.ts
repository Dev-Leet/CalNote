const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Maps a weekday name ("Monday") from extracted text to the next actual
 * calendar date matching it — including TODAY if today is that weekday,
 * since "Monday" in a notice received on a Monday almost always means
 * that same day, not a week later. Returns null for unrecognized input
 * rather than guessing, so the UI can flag it for manual correction
 * instead of silently defaulting to a wrong date.
 */
export function resolveDayToDate(dayText: string, referenceDate: Date = new Date()): Date | null {
  const normalized = dayText.trim().toLowerCase();
  const targetIndex = WEEKDAY_INDEX[normalized];
  if (targetIndex === undefined) return null;

  const result = new Date(referenceDate);
  const currentIndex = result.getDay();
  const diff = (targetIndex - currentIndex + 7) % 7;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}