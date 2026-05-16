// Cache module barrel export
export { redisConfig, type RedisConfig } from "./cache.config";
export { redisClient, type IRedisClient, type IRedisClientConfig } from "./redis-client";
export {
  CacheTTL,
  CacheKeys,
  getTTLForKey,
  type CacheKey,
  type CacheKeyPattern,
  type CacheKeyGenerators,
  type CacheTTLValues,
  type CacheInvalidationEvent,
  getKeysForInvalidationEvent,
  containsPattern,
} from "./cache-key.registry";
export {
  cacheInvalidationService,
  type ICacheInvalidationService,
} from "./cache-invalidation.service";
export { CacheError, CacheErrors, type CacheErrorCode } from "./cache-errors";
export { cacheMetrics, type ICacheMetrics } from "./cache-metrics";