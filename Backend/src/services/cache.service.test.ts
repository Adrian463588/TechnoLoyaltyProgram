import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CacheService } from "./cache.service";
import { redisClient } from "../utils/cache/redis-client";
import { cacheMetrics } from "../utils/cache/cache-metrics";

// Mock dependencies
vi.mock("../utils/cache/redis-client", () => ({
  redisClient: {
    isConnected: vi.fn(),
    isEnabled: vi.fn(),
    getClient: vi.fn(),
    getKeyPrefix: vi.fn(() => "loyalty:test"),
  },
}));

vi.mock("../utils/cache/cache-metrics", () => ({
  cacheMetrics: {
    recordHit: vi.fn(),
    recordMiss: vi.fn(),
    recordError: vi.fn(),
  },
}));

describe("CacheService", () => {
  let mockRedisClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      scan: vi.fn(),
    };
    
    vi.mocked(redisClient.isConnected).mockReturnValue(true);
    vi.mocked(redisClient.isEnabled).mockReturnValue(true);
    vi.mocked(redisClient.getClient).mockReturnValue(mockRedisClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("get", () => {
    it("should return null if Redis is not connected", async () => {
      vi.mocked(redisClient.isConnected).mockReturnValue(false);
      const result = await CacheService.get("token:balance:user-123" as any);
      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it("should return null if Redis is disabled", async () => {
      vi.mocked(redisClient.isEnabled).mockReturnValue(false);
      const result = await CacheService.get("token:balance:user-123" as any);
      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it("should return parsed JSON data on cache hit", async () => {
      const mockData = { balance: 100 };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await CacheService.get("token:balance:user-123" as any);

      expect(mockRedisClient.get).toHaveBeenCalledWith("loyalty:test:token:balance:user-123");
      expect(result).toEqual(mockData);
      expect(cacheMetrics.recordHit).toHaveBeenCalled();
      expect(cacheMetrics.recordMiss).not.toHaveBeenCalled();
    });

    it("should return null on cache miss", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await CacheService.get("token:balance:user-123" as any);

      expect(mockRedisClient.get).toHaveBeenCalledWith("loyalty:test:token:balance:user-123");
      expect(result).toBeNull();
      expect(cacheMetrics.recordHit).not.toHaveBeenCalled();
      expect(cacheMetrics.recordMiss).toHaveBeenCalled();
    });

    it("should handle JSON parse errors gracefully", async () => {
      mockRedisClient.get.mockResolvedValue("invalid json");

      const result = await CacheService.get("token:balance:user-123" as any);

      expect(result).toBeNull();
      expect(cacheMetrics.recordError).toHaveBeenCalled();
    });

    it("should handle redis errors gracefully", async () => {
      mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

      const result = await CacheService.get("token:balance:user-123" as any);

      expect(result).toBeNull();
      expect(cacheMetrics.recordError).toHaveBeenCalled();
    });
  });

  describe("set", () => {
    it("should not set if Redis is not connected", async () => {
      vi.mocked(redisClient.isConnected).mockReturnValue(false);
      await CacheService.set("token:balance:user-123" as any, { balance: 100 });
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it("should store JSON stringified data with correct TTL", async () => {
      const mockData = { balance: 100 };
      // Pass custom TTL to bypass getTTLForKey mocking needs
      await CacheService.set("token:balance:user-123" as any, mockData, 300);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "loyalty:test:token:balance:user-123",
        JSON.stringify(mockData),
        "EX",
        300
      );
    });

    it("should handle redis errors gracefully", async () => {
      mockRedisClient.set.mockRejectedValue(new Error("Redis error"));

      await expect(
        CacheService.set("token:balance:user-123" as any, { balance: 100 }, 300)
      ).resolves.not.toThrow();

      expect(cacheMetrics.recordError).toHaveBeenCalled();
    });
  });

  describe("getWithFallback", () => {
    it("should return cached value if present and not call fetcher", async () => {
      const mockData = { balance: 100 };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockData));
      const fetcher = vi.fn().mockResolvedValue({ balance: 200 });

      const result = await CacheService.getWithFallback("token:balance:user-123" as any, fetcher, 300);

      expect(result).toEqual(mockData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should call fetcher and set cache if cache miss", async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const fetchedData = { balance: 200 };
      const fetcher = vi.fn().mockResolvedValue(fetchedData);

      const result = await CacheService.getWithFallback("token:balance:user-123" as any, fetcher, 300);

      expect(result).toEqual(fetchedData);
      expect(fetcher).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "loyalty:test:token:balance:user-123",
        JSON.stringify(fetchedData),
        "EX",
        300
      );
    });

    it("should not cache if fetcher returns null", async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const fetcher = vi.fn().mockResolvedValue(null);

      const result = await CacheService.getWithFallback("token:balance:user-123" as any, fetcher, 300);

      expect(result).toBeNull();
      expect(fetcher).toHaveBeenCalled();
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });
  });

  describe("del", () => {
    it("should delete key from redis", async () => {
      await CacheService.del("token:balance:user-123" as any);
      expect(mockRedisClient.del).toHaveBeenCalledWith("loyalty:test:token:balance:user-123");
    });

    it("should handle redis errors gracefully", async () => {
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      await expect(CacheService.del("token:balance:user-123" as any)).resolves.not.toThrow();
      expect(cacheMetrics.recordError).toHaveBeenCalled();
    });
  });

  describe("delByPattern", () => {
    it("should use SCAN to delete keys matching pattern", async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce(["1", ["loyalty:test:pattern:1", "loyalty:test:pattern:2"]])
        .mockResolvedValueOnce(["0", []]);

      await CacheService.delByPattern("pattern:*" as any);

      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledWith("loyalty:test:pattern:1", "loyalty:test:pattern:2");
    });
    
    it("should handle redis errors gracefully", async () => {
      mockRedisClient.scan.mockRejectedValue(new Error("Redis error"));

      await expect(CacheService.delByPattern("pattern:*" as any)).resolves.not.toThrow();
      expect(cacheMetrics.recordError).toHaveBeenCalled();
    });
  });
});
