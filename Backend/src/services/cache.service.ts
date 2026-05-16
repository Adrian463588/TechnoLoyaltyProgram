import { redisClient } from "../utils/cache/redis-client";
import { getTTLForKey, type CacheKey, type CacheInvalidationEvent, getKeysForInvalidationEvent } from "../utils/cache/cache-key.registry";
import { cacheMetrics } from "../utils/cache/cache-metrics";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CacheService {
  /**
   * Get an item from the cache
   */
  static async get<T>(key: CacheKey): Promise<T | null> {
    if (!redisClient.isConnected() || !redisClient.isEnabled()) {
      return null;
    }

    const startTime = Date.now();
    try {
      const client = redisClient.getClient();
      if (!client) return null;

      const prefix = redisClient.getKeyPrefix();
      const fullKey = `${prefix}:${key}`;
      const data = await client.get(fullKey);

      const duration = Date.now() - startTime;
      if (!data) {
        cacheMetrics.recordMiss(duration);
        return null;
      }
      cacheMetrics.recordHit(duration);
      return JSON.parse(data) as T;
    } catch (error) {
      cacheMetrics.recordError();
      console.warn(`[CACHE] Failed to get key ${key}:`, error);
      return null; // Fallback gracefully
    }
  }

  /**
   * Get an item from the cache, or fetch it and cache it if not present
   */
  static async getWithFallback<T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fetched = await fetcher();
    
    // Only cache if the fetched data is not null/undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (fetched !== null && fetched !== undefined) {
      await this.set(key, fetched, customTtl);
    }
    
    return fetched;
  }

  /**
   * Set an item in the cache
   */
  static async set(key: CacheKey, value: unknown, customTtl?: number): Promise<void> {
    if (!redisClient.isConnected() || !redisClient.isEnabled()) {
      return;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return;

      const prefix = redisClient.getKeyPrefix();
      const fullKey = `${prefix}:${key}`;
      const data = JSON.stringify(value);
      const ttl = customTtl || getTTLForKey(key);

      await client.set(fullKey, data, "EX", ttl);
    } catch (error) {
      cacheMetrics.recordError();
      console.warn(`[CACHE] Failed to set key ${key}:`, error);
    }
  }

  /**
   * Delete a specific key from the cache
   */
  static async del(key: CacheKey): Promise<void> {
    if (!redisClient.isConnected() || !redisClient.isEnabled()) {
      return;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return;

      const prefix = redisClient.getKeyPrefix();
      const fullKey = `${prefix}:${key}`;
      await client.del(fullKey);
    } catch (error) {
      cacheMetrics.recordError();
      console.warn(`[CACHE] Failed to delete key ${key}:`, error);
    }
  }

  /**
   * Delete keys matching a pattern
   */
  static async delByPattern(pattern: string): Promise<void> {
    if (!redisClient.isConnected() || !redisClient.isEnabled()) {
      return;
    }

    try {
      const client = redisClient.getClient();
      if (!client) return;

      const prefix = redisClient.getKeyPrefix();
      const fullPattern = `${prefix}:${pattern}`;
      
      let cursor = "0";
      do {
        const [nextCursor, keys] = await client.scan(cursor, "MATCH", fullPattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== "0");
    } catch (error) {
      cacheMetrics.recordError();
      console.warn(`[CACHE] Failed to delete keys by pattern ${pattern}:`, error);
    }
  }

  /**
   * Invalidate cache based on domain event
   */
  static async invalidate(event: CacheInvalidationEvent): Promise<void> {
    if (!redisClient.isConnected() || !redisClient.isEnabled()) {
      return;
    }

    try {
      const keys = getKeysForInvalidationEvent(event);
      
      for (const key of keys) {
        if (key.includes("*")) {
          await this.delByPattern(key);
        } else {
          await this.del(key);
        }
      }
    } catch (error) {
      cacheMetrics.recordError();
      console.warn(`[CACHE] Failed to invalidate event ${event.type}:`, error);
    }
  }
}
