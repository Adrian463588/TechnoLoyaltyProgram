import { describe, it, expect, beforeEach, vi } from "vitest";
import { redisConfigSchema } from "./cache.config";

/**
 * Unit tests for cache configuration validation
 * Validates: Requirements 1.3
 */
describe("cache.config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  const validConfig = {
    REDIS_ENABLED: true,
    REDIS_HOST: "localhost",
    REDIS_PORT: 6379,
    REDIS_PASSWORD: undefined,
    REDIS_USE_TLS: false,
    REDIS_CONNECTION_TIMEOUT: 5000,
    REDIS_MAX_RETRIES: 3,
    REDIS_KEY_PREFIX: "loyalty:dev",
    REDIS_DEFAULT_TTL: 300,
  };

  describe("valid config objects", () => {
    it("should pass validation with default valid config", () => {
      const result = redisConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.REDIS_HOST).toBe("localhost");
        expect(result.data.REDIS_PORT).toBe(6379);
      }
    });

    it("should pass with all optional fields provided", () => {
      const configWithAllFields = {
        ...validConfig,
        REDIS_PASSWORD: "secret",
        REDIS_USE_TLS: true,
        REDIS_CONNECTION_TIMEOUT: 10000,
        REDIS_MAX_RETRIES: 5,
        REDIS_KEY_PREFIX: "loyalty:prod",
        REDIS_DEFAULT_TTL: 600,
      };
      const result = redisConfigSchema.safeParse(configWithAllFields);
      expect(result.success).toBe(true);
    });

    it("should pass with boundary valid values", () => {
      const boundaryConfig = {
        REDIS_ENABLED: false,
        REDIS_HOST: "a".repeat(255),
        REDIS_PORT: 65535,
        REDIS_PASSWORD: undefined,
        REDIS_USE_TLS: false,
        REDIS_CONNECTION_TIMEOUT: 0,
        REDIS_MAX_RETRIES: 0,
        REDIS_KEY_PREFIX: "a".repeat(64),
        REDIS_DEFAULT_TTL: 31536000,
      };
      const result = redisConfigSchema.safeParse(boundaryConfig);
      expect(result.success).toBe(true);
    });

    it("should pass with minimum valid port", () => {
      const minPortConfig = { ...validConfig, REDIS_PORT: 1 };
      const result = redisConfigSchema.safeParse(minPortConfig);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid host validation", () => {
    it("should reject empty host", () => {
      const emptyHostConfig = { ...validConfig, REDIS_HOST: "" };
      const result = redisConfigSchema.safeParse(emptyHostConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes("REDIS_HOST"))).toBe(true);
      }
    });

    it("should reject host exceeding 255 characters", () => {
      const longHostConfig = { ...validConfig, REDIS_HOST: "a".repeat(256) };
      const result = redisConfigSchema.safeParse(longHostConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hostIssue = result.error.issues.find(i => i.path.includes("REDIS_HOST"));
        expect(hostIssue).toBeDefined();
        expect(hostIssue?.message).toContain("255");
      }
    });

    it("should reject null host", () => {
      const nullHostConfig = { ...validConfig, REDIS_HOST: null as any };
      const result = redisConfigSchema.safeParse(nullHostConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid port validation", () => {
    it("should reject port less than 1", () => {
      const minPortConfig = { ...validConfig, REDIS_PORT: 0 };
      const result = redisConfigSchema.safeParse(minPortConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        const portIssue = result.error.issues.find(i => i.path.includes("REDIS_PORT"));
        expect(portIssue).toBeDefined();
      }
    });

    it("should reject port greater than 65535", () => {
      const maxPortConfig = { ...validConfig, REDIS_PORT: 65536 };
      const result = redisConfigSchema.safeParse(maxPortConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        const portIssue = result.error.issues.find(i => i.path.includes("REDIS_PORT"));
        expect(portIssue).toBeDefined();
      }
    });

    it("should reject non-integer port", () => {
      const floatPortConfig = { ...validConfig, REDIS_PORT: 6379.5 };
      const result = redisConfigSchema.safeParse(floatPortConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        const portIssue = result.error.issues.find(i => i.path.includes("REDIS_PORT"));
        expect(portIssue).toBeDefined();
      }
    });

    it("should reject negative port", () => {
      const negativePortConfig = { ...validConfig, REDIS_PORT: -1 };
      const result = redisConfigSchema.safeParse(negativePortConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid TTL validation", () => {
    it("should reject TTL less than 1", () => {
      const minTtlConfig = { ...validConfig, REDIS_DEFAULT_TTL: 0 };
      const result = redisConfigSchema.safeParse(minTtlConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        const ttlIssue = result.error.issues.find(i => i.path.includes("REDIS_DEFAULT_TTL"));
        expect(ttlIssue).toBeDefined();
      }
    });

    it("should reject TTL greater than 31536000", () => {
      const maxTtlConfig = { ...validConfig, REDIS_DEFAULT_TTL: 31536001 };
      const result = redisConfigSchema.safeParse(maxTtlConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        const ttlIssue = result.error.issues.find(i => i.path.includes("REDIS_DEFAULT_TTL"));
        expect(ttlIssue).toBeDefined();
      }
    });

    it("should reject negative TTL", () => {
      const negativeTtlConfig = { ...validConfig, REDIS_DEFAULT_TTL: -100 };
      const result = redisConfigSchema.safeParse(negativeTtlConfig);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer TTL", () => {
      const floatTtlConfig = { ...validConfig, REDIS_DEFAULT_TTL: 300.5 };
      const result = redisConfigSchema.safeParse(floatTtlConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("optional fields validation", () => {
    it("should accept undefined optional password", () => {
      const noPasswordConfig = { ...validConfig, REDIS_PASSWORD: undefined };
      const result = redisConfigSchema.safeParse(noPasswordConfig);
      expect(result.success).toBe(true);
    });

    it("should reject password exceeding 512 characters", () => {
      const longPasswordConfig = { ...validConfig, REDIS_PASSWORD: "a".repeat(513) };
      const result = redisConfigSchema.safeParse(longPasswordConfig);
      expect(result.success).toBe(false);
    });

    it("should reject key prefix exceeding 64 characters", () => {
      const longPrefixConfig = { ...validConfig, REDIS_KEY_PREFIX: "a".repeat(65) };
      const result = redisConfigSchema.safeParse(longPrefixConfig);
      expect(result.success).toBe(false);
    });

    it("should reject negative connection timeout", () => {
      const negTimeoutConfig = { ...validConfig, REDIS_CONNECTION_TIMEOUT: -1 };
      const result = redisConfigSchema.safeParse(negTimeoutConfig);
      expect(result.success).toBe(false);
    });

    it("should reject negative max retries", () => {
      const negRetriesConfig = { ...validConfig, REDIS_MAX_RETRIES: -1 };
      const result = redisConfigSchema.safeParse(negRetriesConfig);
      expect(result.success).toBe(false);
    });
  });
});