import { z } from "zod";

/**
 * Redis configuration schema with Zod validation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
const redisConfigSchema = z.object({
  REDIS_ENABLED: z
    .boolean()
    .default(true),
  REDIS_HOST: z
    .string()
    .max(255, "REDIS_HOST must be at most 255 characters"),
  REDIS_PORT: z
    .coerce()
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
    .coerce()
    .number()
    .int()
    .min(0, "REDIS_CONNECTION_TIMEOUT must be non-negative")
    .default(5000),
  REDIS_MAX_RETRIES: z
    .coerce()
    .number()
    .int()
    .min(0, "REDIS_MAX_RETRIES must be non-negative")
    .default(3),
  REDIS_KEY_PREFIX: z
    .string()
    .max(64, "REDIS_KEY_PREFIX must be at most 64 characters")
    .default("loyalty:dev"),
  REDIS_DEFAULT_TTL: z
    .coerce()
    .number()
    .int()
    .min(0, "REDIS_DEFAULT_TTL must be non-negative")
    .default(300),
});

/**
 * Redis configuration type derived from schema
 */
export type RedisConfig = z.infer<typeof redisConfigSchema>;

/**
 * Parse and validate Redis configuration from environment variables
 */
function parseRedisConfig(): RedisConfig {
  const result = redisConfigSchema.safeParse({
    REDIS_ENABLED: process.env.REDIS_ENABLED,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_USE_TLS: process.env.REDIS_USE_TLS,
    REDIS_CONNECTION_TIMEOUT: process.env.REDIS_CONNECTION_TIMEOUT,
    REDIS_MAX_RETRIES: process.env.REDIS_MAX_RETRIES,
    REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX,
    REDIS_DEFAULT_TTL: process.env.REDIS_DEFAULT_TTL,
  });

  if (!result.success) {
    throw new Error(
      `Invalid Redis configuration: ${result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`
    );
  }

  return result.data;
}

/**
 * Redis configuration singleton instance
 */
export const redisConfig: RedisConfig = parseRedisConfig();