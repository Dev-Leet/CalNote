import { ContestModel, IContest } from '../../models/Contest.model';
import { IContestSource } from './sources/IContestSource';
import { codeforcesSource } from './sources/codeforces.source';
import { leetcodeSource } from './sources/leetcode.source';
import { codechefSource } from './sources/codechef.source';
import { redisClient } from '../../config/redis';
import { logger } from '../../utils/logger';

const SOURCES: IContestSource[] = [codeforcesSource, leetcodeSource, codechefSource];
const CONTEST_CACHE_PREFIX = 'contests:list:';

export interface ScrapeCycleResult {
  totalUpserted: number;
  totalErrors: number;
  durationMs: number;
  perPlatform: { platform: string; upserted: number; error?: string }[];
}

export interface ContestQueryFilters {
  platform?: string;
  from?: Date;
  to?: Date;
}

export class ContestService {
  /**
   * Orchestrates the full scrape cycle: calls every registered IContestSource,
   * normalizes results, and upserts into MongoDB. One platform's failure never
   * blocks another (NFR-2 graceful degradation) — errors are collected, not thrown.
   */
  async runScrapeCycle(): Promise<ScrapeCycleResult> {
    const runStart = Date.now();
    let totalUpserted = 0;
    let totalErrors = 0;
    const perPlatform: ScrapeCycleResult['perPlatform'] = [];

    for (const source of SOURCES) {
      try {
        const rawContests = await source.fetchUpcoming();
        let upsertedForPlatform = 0;

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
          upsertedForPlatform += 1;
        }

        totalUpserted += upsertedForPlatform;
        perPlatform.push({ platform: source.platform, upserted: upsertedForPlatform });
      } catch (err) {
        totalErrors += 1;
        const message = err instanceof Error ? err.message : 'Unknown error';
        perPlatform.push({ platform: source.platform, upserted: 0, error: message });
        logger.error({ err, platform: source.platform }, 'Contest scrape failed for platform');
      }
    }

    await this.invalidateContestCache();

    const result: ScrapeCycleResult = {
      totalUpserted,
      totalErrors,
      durationMs: Date.now() - runStart,
      perPlatform,
    };

    logger.info(result, 'Contest scrape cycle complete');
    return result;
  }

  async invalidateContestCache(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${CONTEST_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      logger.error({ err }, 'Failed to invalidate contest cache');
    }
  }

  async getContests(filters: ContestQueryFilters): Promise<IContest[]> {
    const cacheKey = `${CONTEST_CACHE_PREFIX}${filters.platform ?? 'all'}:${filters.from?.toISOString() ?? ''}:${filters.to?.toISOString() ?? ''}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as IContest[];
      }
    } catch (err) {
      logger.warn({ err }, 'Contest cache read failed, falling back to DB');
    }

    const query: Record<string, unknown> = {};
    if (filters.platform) query.platform = filters.platform;
    if (filters.from || filters.to) {
      query.startTime = {
        ...(filters.from && { $gte: filters.from }),
        ...(filters.to && { $lte: filters.to }),
      };
    }

    const contests = await ContestModel.find(query).sort({ startTime: 1 }).limit(200).lean().exec();

    try {
      await redisClient.set(cacheKey, JSON.stringify(contests), { EX: 30 * 60 }); // 30-min TTL, matches cron interval
    } catch (err) {
      logger.warn({ err }, 'Contest cache write failed');
    }

    return contests as IContest[];
  }
}

export const contestService = new ContestService();
