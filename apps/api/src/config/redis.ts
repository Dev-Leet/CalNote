// apps/api/src/config/redis.ts
// Redis client and CacheService using ioredis

import Redis from 'ioredis';
import { config } from './env';
import { logger } from './logger';

// Create Redis client
export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) {
      logger.error('Redis: too many retries, giving up');
      return null; // Stop retrying
    }
    return Math.min(times * 1000, 3000);
  },
  reconnectOnError(err) {
    logger.error('Redis reconnect error:', err.message);
    return true;
  },
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err.message));
redis.on('close', () => logger.warn('Redis connection closed'));

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    logger.warn('Redis not available - caching disabled');
  }
}

// =============================================
// CacheService — Typed Redis wrapper
// =============================================

export class CacheService {
  /**
   * Get a cached value (returns null on miss or error)
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set a cached value with optional TTL (seconds)
   */
  static async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (err) {
      logger.warn(`Cache set failed for key ${key}:`, err);
    }
  }

  /**
   * Delete a specific key
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn(`Cache del failed for key ${key}:`, err);
    }
  }

  /**
   * Delete all keys matching a pattern (e.g. "contests:*")
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.warn(`Cache delPattern failed for pattern ${pattern}:`, err);
    }
  }

  /**
   * Check if a key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }
}
