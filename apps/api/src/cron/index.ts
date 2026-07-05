// apps/api/src/cron/index.ts
// Register all scheduled background jobs

import { initContestScraperJob } from './contestScraper';
import { logger } from '../config/logger';

export function initCronJobs(): void {
  logger.info('⏰ Initializing background cron jobs...');
  initContestScraperJob();
  logger.info('✅ All cron jobs initialized');
}
