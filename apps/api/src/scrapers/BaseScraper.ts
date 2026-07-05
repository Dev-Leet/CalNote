// apps/api/src/scrapers/BaseScraper.ts
// Abstract base class for all contest scrapers

import { Platform } from '@prisma/client';
import { logger } from '../config/logger';

export interface ScrapedContest {
  platform: Platform;
  name: string;
  url: string;
  startTime: Date; // UTC
  endTime: Date;   // UTC
  duration: number; // minutes
  externalId?: string;
  difficulty?: string;
  phase?: string;
  status: string;
}

export abstract class BaseScraper {
  abstract readonly platform: Platform;
  abstract readonly platformKey: string; // e.g. 'leetcode', 'codeforces'

  abstract fetchContests(): Promise<ScrapedContest[]>;

  protected log(message: string, ...args: unknown[]): void {
    logger.info(`[${this.platform}] ${message}`, ...args);
  }

  protected logError(message: string, error: unknown): void {
    logger.error(`[${this.platform}] ${message}`, { error });
  }

  /**
   * Parse a Kontests.net duration string to minutes
   * e.g. "1:30:00" → 90, "7200.0" → 120
   */
  protected parseDuration(duration: string | number): number {
    if (typeof duration === 'number') return Math.round(duration / 60);

    // Try "HH:MM:SS" format
    const colonMatch = duration.match(/^(\d+):(\d+):(\d+)$/);
    if (colonMatch) {
      const [, h, m, s] = colonMatch.map(Number);
      return h * 60 + m + Math.round(s / 60);
    }

    // Try seconds as float string
    const secs = parseFloat(duration);
    if (!isNaN(secs)) return Math.round(secs / 60);

    return 120; // Default 2 hours
  }

  /**
   * Filter to only include future contests
   */
  protected filterUpcoming(contests: ScrapedContest[]): ScrapedContest[] {
    const now = new Date();
    return contests.filter((c) => c.endTime > now);
  }
}
