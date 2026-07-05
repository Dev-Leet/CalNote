// packages/shared/src/utils/constants.ts
// Application-wide constants

export const APP_NAME = 'CalNote';
export const APP_TAGLINE = 'Never miss a coding contest again';
export const APP_VERSION = '1.0.0';

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CACHE_TTL = {
  CONTESTS: 300,       // 5 minutes
  USER_SESSION: 604800, // 7 days
  AI_NOTE: 3600,       // 1 hour
} as const;

export const REMINDER_MINUTES = [5, 15] as const;

export const PLATFORMS = ['LEETCODE', 'CODEFORCES', 'CODECHEF'] as const;

export const SCRAPE_PLATFORMS = {
  LEETCODE: 'leetcode',
  CODEFORCES: 'codeforces',
  CODECHEF: 'codechef',
} as const;

export const KONTESTS_BASE_URL = 'https://kontests.net/api/v1';
