import Agenda from 'agenda';
import { ContestModel } from '../../models/Contest.model';
import { codeforcesSource } from './sources/codeforces.source';
import { leetcodeSource } from './sources/leetcode.source';
import { logger } from '../../utils/logger';
import { redisClient } from '../../config/redis';

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
  const runStart = Date.now();
  let totalUpserted = 0;
  let totalErrors = 0;

  for (const source of SOURCES) {
    try {
      const rawContests = await source.fetchUpcoming();

      for (const contest of rawContests) {
        await ContestModel.updateOne(
          { platform: source.platform, externalId: contest.externalId },
          {
            $set: {
              name: contest.name,
              startTime: contest.startTime,
              endTime: contest.endTime,
              url: contest.url,
              durationMinutes: contest.durationMinutes,
              lastSyncedAt: new Date(),
            },
            $setOnInsert: { fetchedAt: new Date() },
          },
          { upsert: true },
        );
        totalUpserted += 1;
      }
    } catch (err) {
      totalErrors += 1;
      logger.error({ err, platform: source.platform }, 'Contest scrape failed for platform');
      // Continue to next platform — one platform's failure must not block others
      // or degrade core calendar functionality (NFR-2 graceful degradation).
    }
  }

  // Invalidate cached contest listings so the next GET /contests reflects fresh data.
  try {
    const keys = await redisClient.keys(`${CONTEST_CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    logger.error({ err }, 'Failed to invalidate contest cache after scrape');
  }

  logger.info(
    { totalUpserted, totalErrors, durationMs: Date.now() - runStart },
    'Contest scrape cycle complete',
  );
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
