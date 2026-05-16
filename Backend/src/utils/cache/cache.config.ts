import { z } from "zod";

/**
 * Redis configuration schema with Zod validation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
export const redisConfigSchema = z.object({
  REDIS_ENABLED: z
    .boolean()
    .default(true),
  REDIS_HOST: z
    .string()
    .min(1, "REDIS_HOST cannot be empty")
    .max(255, "REDIS_HOST must be at most 255 characters"),
  REDIS_PORT: z
    .number()
    .int()
    .min(1, "REDIS_PORT must be between 1 and 65535")
    .max(65535, "REDIS_PORT must be between 1 and 65535"),
  REDIS_PASSWORD: z
    .string()
    .max(512, "REDIS_PASSWORD must be at most 512 characters")
    .optional(),
  REDIS_USE_TLS: z
    .boolean()
    .default(false),
  REDIS_CONNECTION_TIMEOUT: z
    .number()
    .int()
    .min(0, "REDIS_CONNECTION_TIMEOUT must be non-negative")
    .default(5000),
  REDIS_MAX_RETRIES: z
    .number()
    .int()
    .min(0, "REDIS_MAX_RETRIES must be non-negative")
    .default(3),
  REDIS_KEY_PREFIX: z
    .string()
    .max(64, "REDIS_KEY_PREFIX must be at most 64 characters")
    .default("loyalty:dev"),
  REDIS_DEFAULT_TTL: z
    .number()
    .int()
    .min(1, "REDIS_DEFAULT_TTL must be between 1 and 31536000")
    .max(31536000, "REDIS_DEFAULT_TTL must be between 1 and 31536000")
    .default(300),
});

/**
 * Redis configuration type derived from schema
 */
export type RedisConfig = z.infer<typeof redisConfigSchema>;

/**
 * Parse string to number safely
 */
function parseNumber(value: unknown, defaultValue: number): number {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse string to boolean safely
 */
function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return defaultValue;
}

/**
 * Parse and validate Redis configuration from environment variables
 */
function parseRedisConfig(): RedisConfig {
  const result = redisConfigSchema.safeParse({
    REDIS_ENABLED: parseBoolean(process.env.REDIS_ENABLED, true),
    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: parseNumber(process.env.REDIS_PORT, 6379),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_USE_TLS: parseBoolean(process.env.REDIS_USE_TLS, false),
    REDIS_CONNECTION_TIMEOUT: parseNumber(process.env.REDIS_CONNECTION_TIMEOUT, 5000),
    REDIS_MAX_RETRIES: parseNumber(process.env.REDIS_MAX_RETRIES, 3),
    REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || "loyalty:dev",
    REDIS_DEFAULT_TTL: parseNumber(process.env.REDIS_DEFAULT_TTL, 300),
  });

  if (!result.success) {
    const errorMessages = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    throw new Error(`Invalid Redis configuration: ${errorMessages.join(", ")}`);
  }

  return result.data;
}

/**
 * Redis configuration singleton instance
 */
export const redisConfig: RedisConfig = parseRedisConfig();