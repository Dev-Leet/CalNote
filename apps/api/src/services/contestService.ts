// apps/api/src/services/contestService.ts
// Contest business logic with Redis caching

import { Contest, Platform } from '@prisma/client';
import { prisma } from '../config/database';
import { CacheService } from '../config/redis';
import { logger } from '../config/logger';
import { addDays, startOfDay, endOfDay } from 'date-fns';

interface GetContestsOptions {
  page?: number;
  limit?: number;
  platform?: string;
  upcoming?: boolean;
}

class ContestService {
  private readonly CACHE_TTL = 300; // 5 minutes

  async getContests(options: GetContestsOptions = {}): Promise<{
    contests: Contest[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: {
      platform?: Platform;
      startTime?: { gte: Date };
    } = {};

    if (options.platform) {
      where.platform = options.platform.toUpperCase() as Platform;
    }
    if (options.upcoming) {
      where.startTime = { gte: new Date() };
    }

    const cacheKey = `contests:list:${JSON.stringify({ page, limit, ...options })}`;
    const cached = await CacheService.get<ReturnType<ContestService['getContests']> extends Promise<infer T> ? T : never>(cacheKey);
    if (cached) return cached;

    try {
      const [contests, total] = await Promise.all([
        prisma.contest.findMany({
          where,
          orderBy: { startTime: 'asc' },
          skip,
          take: limit,
        }),
        prisma.contest.count({ where }),
      ]);

      const result = {
        contests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      };

      await CacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error('getContests error:', error);
      throw error;
    }
  }

  async getContestById(id: string): Promise<Contest | null> {
    const cacheKey = `contests:${id}`;
    const cached = await CacheService.get<Contest>(cacheKey);
    if (cached) return cached;

    const contest = await prisma.contest.findUnique({ where: { id } });
    if (contest) await CacheService.set(cacheKey, contest, this.CACHE_TTL);
    return contest;
  }

  async getUpcomingContests(days = 30): Promise<Contest[]> {
    const cacheKey = `contests:upcoming:${days}`;
    const cached = await CacheService.get<Contest[]>(cacheKey);
    if (cached) return cached;

    const contests = await prisma.contest.findMany({
      where: {
        startTime: {
          gte: new Date(),
          lte: addDays(new Date(), days),
        },
      },
      orderBy: { startTime: 'asc' },
    });

    await CacheService.set(cacheKey, contests, this.CACHE_TTL);
    return contests;
  }

  async getTodayContests(): Promise<Contest[]> {
    const cacheKey = 'contests:today';
    const cached = await CacheService.get<Contest[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const contests = await prisma.contest.findMany({
      where: {
        OR: [
          { startTime: { gte: startOfDay(now), lte: endOfDay(now) } },
          { AND: [{ startTime: { lte: startOfDay(now) } }, { endTime: { gte: endOfDay(now) } }] },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    await CacheService.set(cacheKey, contests, 60);
    return contests;
  }

  async getStats(): Promise<{
    total: number;
    upcoming: number;
    byPlatform: Record<string, number>;
  }> {
    const [total, upcoming, byPlatform] = await Promise.all([
      prisma.contest.count(),
      prisma.contest.count({ where: { startTime: { gte: new Date() } } }),
      prisma.contest.groupBy({
        by: ['platform'],
        _count: { id: true },
        where: { startTime: { gte: new Date() } },
      }),
    ]);

    return {
      total,
      upcoming,
      byPlatform: Object.fromEntries(
        byPlatform.map((b) => [b.platform, b._count.id])
      ),
    };
  }
}

export const contestService = new ContestService();
