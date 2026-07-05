// apps/api/src/cron/contestScraper.ts
// Scheduled contest scraping job

import cron from 'node-cron';
import { scraperService } from '../services/scraperService';
import { logger } from '../config/logger';
import { config } from '../config/env';

let isRunning = false;

export async function runScrapeJob(): Promise<void> {
  if (isRunning) {
    logger.warn('Scrape job is already running, skipping...');
    return;
  }

  isRunning = true;
  const start = Date.now();

  try {
    logger.info('⏰ Contest scrape job started');
    const results = await scraperService.scrapeAll();

    const total = results.reduce((sum, r) => sum + r.upserted, 0);
    const duration = Date.now() - start;

    logger.info(`✅ Scrape job completed: ${total} contests in ${duration}ms`);
  } catch (error) {
    logger.error('❌ Scrape job failed:', error);
  } finally {
    isRunning = false;
  }
}

export function initContestScraperJob(): void {
  const schedule = config.scrapeCronSchedule;
  logger.info(`📅 Contest scraper scheduled: ${schedule}`);

  cron.schedule(schedule, () => {
    runScrapeJob();
  });

  // Run immediately on startup
  runScrapeJob();
}
