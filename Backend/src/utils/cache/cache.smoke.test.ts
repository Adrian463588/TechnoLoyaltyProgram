import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { redisClient } from "./redis-client";
import { CacheService } from "../../services/cache.service";
import { CacheKeys } from "./cache-key.registry";

// Simple smoke test suite for cache module
describe("Cache Module Smoke Tests", () => {
  beforeEach(async () => {
    // Attempt connection
    await redisClient.connect();
  });

  afterEach(async () => {
    // Clean up
    await redisClient.disconnect();
  });

  it("should connect or gracefully fallback to disabled mode", () => {
    // In CI or local dev without Redis, isConnected might be false,
    // but the app should not crash.
    expect(redisClient.isEnabled()).toBeDefined();
    expect(typeof redisClient.isConnected()).toBe("boolean");
  });

  it("should gracefully handle set and get even if disconnected", async () => {
    const key = CacheKeys.tokenBalance("smoke-test-user");
    const val = { balance: 5000 };

    await CacheService.set(key, val, 10);
    const result = await CacheService.get(key);

    if (redisClient.isConnected()) {
      expect(result).toEqual(val);
    } else {
      expect(result).toBeNull();
    }
  });

  it("should support cache invalidation safely", async () => {
    // Should not throw regardless of connection state
    await expect(CacheService.invalidate({
      type: "TOKEN_MUTATED",
      userId: "smoke-test-user"
    })).resolves.not.toThrow();
  });
});