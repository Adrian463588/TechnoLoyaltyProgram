/**
 * Cache Invalidation Service
 *
 * Handles cache invalidation after successful database commits.
 * Maps CacheInvalidationEvent types to affected cache keys and deletes them.
 * Non-blocking error handling: logs CACHE007 on failure, continues.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 * Design: Section 7.5
 */

import { redisClient } from "./redis-client";
import {
  CacheInvalidationEvent,
  getKeysForInvalidationEvent,
  type CacheKey,
  type CacheKeyPattern,
} from "./cache-key.registry";

/**
 * Simple logger for cache operations
 */
const logger = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    console.error(`[CACHE] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  warn: (message: string, meta?: Record<string, unknown>): void => {
    console.warn(`[CACHE] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  error: (message: string, meta?: Record<string, unknown>): void => {
    console.error(`[CACHE] ${message}`, meta ? JSON.stringify(meta) : "");
  },
};

/**
 * Cache Invalidation Service interface
 */
export interface ICacheInvalidationService {
  /**
   * Invalidate cache after a successful database commit
   * Non-blocking: logs failures but does not throw
   *
   * @param event - The cache invalidation event
   */
  invalidateAfterCommit(event: CacheInvalidationEvent): Promise<void>;
}

/**
 * Cache Invalidation Service implementation
 */
export class CacheInvalidationService implements ICacheInvalidationService {
  /**
   * Invalidate cache after a successful database commit
   *
   * Flow:
   * 1. Get affected cache keys from the event
   * 2. Separate specific keys from pattern keys
   * 3. Delete specific keys using deleteBatch
   * 4. Delete pattern keys using deleteByPattern
   * 5. Log failures safely without throwing
   *
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
   */
  async invalidateAfterCommit(event: CacheInvalidationEvent): Promise<void> {
    try {
      // Get affected cache keys from the event
      const keysToInvalidate = getKeysForInvalidationEvent(event);

      if (keysToInvalidate.length === 0) {
        logger.info("No cache keys to invalidate for event", {
          eventType: event.type,
        });
        return;
      }

      // Separate specific keys from pattern keys
      const specificKeys: CacheKey[] = [];
      const patternKeys: CacheKeyPattern[] = [];

      for (const key of keysToInvalidate) {
        if (key.includes("*")) {
          patternKeys.push(key);
        } else {
          specificKeys.push(key);
        }
      }

      // Delete specific keys using deleteBatch
      if (specificKeys.length > 0) {
        await this.deleteBatchSafely(specificKeys);
      }

      // Delete pattern keys using deleteByPattern
      for (const pattern of patternKeys) {
        await this.deleteByPatternSafely(pattern);
      }

      logger.info("Cache invalidation completed", {
        eventType: event.type,
        specificKeysCount: specificKeys.length,
        patternKeysCount: patternKeys.length,
      });
    } catch (error) {
      // Non-blocking error handling: log and continue
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Cache invalidation failed", {
        code: "CACHE007",
        eventType: event.type,
        error: errorMessage,
      });

      // Do not throw - mutation already committed to database
      // Cache will eventually expire via TTL
    }
  }

  /**
   * Delete a batch of cache keys safely
   * Non-blocking: logs failures but does not throw
   */
  private async deleteBatchSafely(keys: CacheKey[]): Promise<void> {
    try {
      if (!redisClient.isConnected()) {
        logger.info("Redis not connected, skipping batch delete", {
          keysCount: keys.length,
        });
        return;
      }

      const client = redisClient.getClient();
      if (!client) {
        return;
      }

      // Process in chunks of 100 keys max per requirement 2.6
      const chunkSize = 100;
      for (let i = 0; i < keys.length; i += chunkSize) {
        const chunk = keys.slice(i, i + chunkSize);

        try {
          await client.del(...chunk);
          logger.info("Batch delete completed", {
            keysCount: chunk.length,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          logger.warn("Batch delete failed for chunk", {
            code: "CACHE007",
            keysCount: chunk.length,
            error: errorMessage,
          });
          // Continue with next chunk
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.warn("Batch delete operation failed", {
        code: "CACHE007",
        error: errorMessage,
      });
      // Non-blocking: do not throw
    }
  }

  /**
   * Delete cache keys by pattern safely
   * Uses scan-based deletion, not blocking KEYS command
   * Non-blocking: logs failures but does not throw
   */
  private async deleteByPatternSafely(pattern: CacheKeyPattern): Promise<void> {
    try {
      if (!redisClient.isConnected()) {
        logger.info("Redis not connected, skipping pattern delete", {
          pattern,
        });
        return;
      }

      const client = redisClient.getClient();
      if (!client) {
        return;
      }

      // Use SCAN to iterate through keys matching the pattern
      // This is non-blocking unlike KEYS command
      let cursor = "0";
      let deletedCount = 0;

      do {
        try {
          const [nextCursor, keys] = await client.scan(
            cursor,
            "MATCH",
            pattern,
            "COUNT",
            100
          );

          cursor = nextCursor;

          if (keys.length > 0) {
            await client.del(...keys);
            deletedCount += keys.length;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          logger.warn("Pattern delete scan iteration failed", {
            code: "CACHE007",
            pattern,
            error: errorMessage,
          });
          // Continue with next iteration
        }
      } while (cursor !== "0");

      logger.info("Pattern delete completed", {
        pattern,
        deletedCount,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.warn("Pattern delete operation failed", {
        code: "CACHE007",
        pattern,
        error: errorMessage,
      });
      // Non-blocking: do not throw
    }
  }
}

/**
 * Create cache invalidation service instance
 */
function createCacheInvalidationService(): ICacheInvalidationService {
  return new CacheInvalidationService();
}

/**
 * Singleton cache invalidation service instance
 * Export for use throughout the backend
 */
export const cacheInvalidationService: ICacheInvalidationService =
  createCacheInvalidationService();
