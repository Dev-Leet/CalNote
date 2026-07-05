// apps/api/src/services/scraperService.ts
// Orchestrates all platform scrapers and upserts results to DB

import { Platform } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { CacheService } from '../config/redis';
import { LeetCodeScraper } from '../scrapers/LeetCodeScraper';
import { CodeforcesScraper } from '../scrapers/CodeforcesScraper';
import { CodeChefScraper } from '../scrapers/CodeChefScraper';
import { ScrapedContest } from '../scrapers/BaseScraper';

const scrapers = [
  new LeetCodeScraper(),
  new CodeforcesScraper(),
  new CodeChefScraper(),
];

export interface ScrapeResult {
  platform: Platform;
  scraped: number;
  upserted: number;
  errors: string[];
}

class ScraperService {
  /**
   * Scrape all platforms and upsert contests into DB
   */
  async scrapeAll(): Promise<ScrapeResult[]> {
    logger.info('🚀 Starting contest scraping for all platforms...');
    const results: ScrapeResult[] = [];

    for (const scraper of scrapers) {
      const result = await this.scrapePlatform(scraper.platform, () =>
        scraper.fetchContests()
      );
      results.push(result);
    }

    // Invalidate contest cache after scraping
    await CacheService.delPattern('contests:*');

    logger.info(
      `✅ Scraping complete. Results: ${results.map((r) => `${r.platform}:${r.upserted}`).join(', ')}`
    );

    // Log to ScraperLog table
    for (const result of results) {
      try {
        await prisma.scraperLog.create({
          data: {
            platform: result.platform,
            status: result.errors.length === 0 ? 'SUCCESS' : result.upserted > 0 ? 'PARTIAL' : 'FAILED',
            contestsFound: result.upserted,
            errors: result.errors.length > 0 ? result.errors : undefined,
            completedAt: new Date(),
          },
        });
      } catch (err) {
        logger.warn(`Failed to log scraper result for ${result.platform}:`, err);
      }
    }

    return results;
  }

  /**
   * Scrape a single platform
   */
  async scrapePlatform(
    platform: Platform,
    fetchFn: () => Promise<ScrapedContest[]>
  ): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      platform,
      scraped: 0,
      upserted: 0,
      errors: [],
    };

    try {
      const contests = await fetchFn();
      result.scraped = contests.length;

      for (const contest of contests) {
        try {
          await prisma.contest.upsert({
            where: {
              platform_url: {
                platform: contest.platform,
                url: contest.url,
              },
            },
            update: {
              name: contest.name,
              startTime: contest.startTime,
              endTime: contest.endTime,
              duration: contest.duration,
              status: contest.status,
              externalId: contest.externalId,
              difficulty: contest.difficulty,
              phase: contest.phase,
              scrapedAt: new Date(),
            },
            create: {
              platform: contest.platform,
              name: contest.name,
              url: contest.url,
              startTime: contest.startTime,
              endTime: contest.endTime,
              duration: contest.duration,
              status: contest.status,
              externalId: contest.externalId,
              difficulty: contest.difficulty,
              phase: contest.phase,
            },
          });
          result.upserted++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Failed to upsert ${contest.name}: ${msg}`);
          logger.warn(`Failed to upsert contest ${contest.name}:`, err);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Scraper failed: ${msg}`);
      logger.error(`Scraper failed for ${platform}:`, err);
    }

    return result;
  }
}

export const scraperService = new ScraperService();
