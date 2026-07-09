import Agenda from 'agenda';
import { ContestModel } from '../../models/Contest.model';
import { codeforcesSource } from './sources/codeforces.source';
import { leetcodeSource } from './sources/leetcode.source';
import { logger } from '../../utils/logger';
import { redisClient } from '../../config/redis';
import { contestService } from './contest.service';

export interface IContestSource {
  platform: string;
  fetchUpcoming(): Promise
    {
      externalId: string;
      name: string;
      startTime: Date;
      endTime: Date;
      url: string;
      durationMinutes: number;
    }[]
  >;
}

const SOURCES: IContestSource[] = [codeforcesSource, leetcodeSource];

const JOB_NAME = 'scrape-contests';
const CONTEST_CACHE_PREFIX = 'contests:list:';

export const agenda = new Agenda({
  db: { address: process.env.MONGO_URI as string, collection: 'agendaJobs' },
  processEvery: '1 minute',
});

agenda.define(JOB_NAME, { concurrency: 1 }, async () => {
  await contestService.runScrapeCycle();
});

export async function startContestCron(): Promise<void> {
  await agenda.start();
  await agenda.every('30 minutes', JOB_NAME);
  logger.info('Contest scraping cron scheduled: every 30 minutes');
}

export async function stopContestCron(): Promise<void> {
  await agenda.stop();
}

/** Allows admin-triggered out-of-band refresh (POST /admin/contests/refresh). */
export async function triggerImmediateScrape(): Promise<void> {
  await agenda.now(JOB_NAME, {});
}
