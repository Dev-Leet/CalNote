import { ContestModel } from '../../models/Contest.model';
import { IContestSource } from './sources/IContestSource';
import { codeforcesSource } from './sources/codeforces.source';
import { leetcodeSource } from './sources/leetcode.source';
import { codechefSource } from './sources/codechef.source';
import { redisClient } from '../../config/redis';
import { logger } from '../../utils/logger';
import { ContestLike } from '../../utils/serializers';

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
  /** When false (default), contests that have already ended are excluded
   *  regardless of `from`/`to` — matches the product decision that finished
   *  contests shouldn't clutter the list. Set true only for a future
   *  "contest history" view, not currently exposed via any route. */
  includePast?: boolean;
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

    await this.purgeStaleContests();
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

  /**
   * Deletes contest documents that ended more than 7 days ago. Safe to run
   * — Event.sourceContestId is a loose reference used only at AI-context-
   * build time (never joined/populated later for display), so removing old
   * contest rows doesn't orphan or break any existing Event.
   */
  async purgeStaleContests(): Promise<number> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await ContestModel.deleteMany({ endTime: { $lt: cutoff } });
    if (result.deletedCount > 0) {
      logger.info({ deletedCount: result.deletedCount }, 'Purged stale (7+ day old) contests');
    }
    return result.deletedCount ?? 0;
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

  async getContests(filters: ContestQueryFilters): Promise<ContestLike[]> {
    const cacheKey = `${CONTEST_CACHE_PREFIX}${filters.platform ?? 'all'}:${filters.from?.toISOString() ?? ''}:${filters.to?.toISOString() ?? ''}:${filters.includePast ? 'past' : 'upcoming'}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        // JSON.parse returns `any`, so this cast is safe — but the parsed
        // startTime/endTime are still ISO STRINGS at this point (JSON has
        // no Date type), not real Date objects. This was silently producing
        // invalid DateTime output from toIST() on every cache-hit response
        // until this fix — rehydrate them explicitly before returning.
        const rawCached = JSON.parse(cached) as ContestLike[];
        return rawCached.map((c) => ({
          ...c,
          startTime: new Date(c.startTime),
          endTime: new Date(c.endTime),
        }));
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
    // Hard baseline regardless of from/to: a contest whose endTime has
    // already passed is never returned by default. Applied via endTime
    // (not startTime) so a currently-live contest (started, not yet ended)
    // still correctly shows up.
    if (!filters.includePast) {
      query.endTime = { $gte: new Date() };
    }

    const contests = await ContestModel.find(query).sort({ startTime: 1 }).limit(200).lean().exec();

    try {
      await redisClient.set(cacheKey, JSON.stringify(contests), { EX: 30 * 60 });
    } catch (err) {
      logger.warn({ err }, 'Contest cache write failed');
    }

    return contests;
  }
}

export const contestService = new ContestService();
