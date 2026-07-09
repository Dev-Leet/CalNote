import Agenda from 'agenda';
import { contestService } from './contest.service';
import { logger } from '../../utils/logger';

const JOB_NAME = 'scrape-contests';

export const agenda = new Agenda({
  db: { address: process.env.MONGO_URI as string, collection: 'agendaJobs' },
  processEvery: '1 minute',
});

agenda.define(JOB_NAME, { concurrency: 1 }, async () => {
  await contestService.runScrapeCycle();
});

agenda.on('start', (job) => {
  logger.info({ jobName: job.attrs.name }, 'Agenda job starting');
});

agenda.on('fail', (err, job) => {
  logger.error({ jobName: job.attrs.name, err }, 'Agenda job failed');
});

export async function startContestCron(): Promise<void> {
  await agenda.start();
  await agenda.every('30 minutes', JOB_NAME);
  logger.info('Contest scraping cron scheduled: every 30 minutes');

  // Run once immediately on boot so the app isn't empty for up to 30 minutes
  // after a fresh deploy — safe since runScrapeCycle() is fully idempotent (upsert-based).
  await agenda.now(JOB_NAME, {});
}

export async function stopContestCron(): Promise<void> {
  await agenda.stop();
}

/** Allows admin-triggered out-of-band refresh (POST /admin/contests/refresh). */
export async function triggerImmediateScrape(): Promise<void> {
  await agenda.now(JOB_NAME, {});
}
