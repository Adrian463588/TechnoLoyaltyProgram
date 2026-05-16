import Redis from "ioredis";
import { redisConfig, type RedisConfig } from "./cache.config";

/**
 * Redis client configuration interface
 * Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7
 */
export interface IRedisClientConfig {
  enabled: boolean;
  host: string;
  port: number;
  password?: string;
  useTLS: boolean;
  connectionTimeoutMs: number;
  maxRetries: number;
  keyPrefix: string;
}

/**
 * Redis client interface for cache operations
 * Design: Section 7.2
 */
export interface IRedisClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  isEnabled(): boolean;
  getClient(): Redis | null;
  getKeyPrefix(): string;
}

/**
 * Simple logger for cache operations
 */
const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[CACHE] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[CACHE] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[CACHE] ${message}`, meta ? JSON.stringify(meta) : "");
  },
};

/**
 * Redis client singleton implementation
 * - Single shared Redis client for backend process
 * - Supports enabled/disabled modes
 * - Handles connection/disconnection with exponential backoff
 */
class RedisClient implements IRedisClient {
  private client: Redis | null = null;
  private config: IRedisClientConfig;
  private connected = false;
  private connecting = false;

  constructor(config: RedisConfig) {
    this.config = {
      enabled: config.REDIS_ENABLED,
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      ...(config.REDIS_PASSWORD && { password: config.REDIS_PASSWORD }),
      useTLS: config.REDIS_USE_TLS,
      connectionTimeoutMs: config.REDIS_CONNECTION_TIMEOUT,
      maxRetries: config.REDIS_MAX_RETRIES,
      keyPrefix: config.REDIS_KEY_PREFIX,
    };
  }

  /**
   * Connect to Redis/Memurai with exponential backoff retry logic
   */
  async connect(): Promise<void> {
    // If disabled, return early without connecting
    if (!this.config.enabled) {
      logger.info("Redis client disabled via REDIS_ENABLED=false");
      return;
    }

    // Prevent multiple concurrent connection attempts
    if (this.connecting || (this.client && this.connected)) {
      return;
    }

    this.connecting = true;

    try {
      const redisOptions = {
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        tls: this.config.useTLS ? {} : undefined,
        connectTimeout: this.config.connectionTimeoutMs,
        retryStrategy: (times: number) => {
          if (times > this.config.maxRetries) {
            logger.warn("Max retry attempts reached", {
              code: "CACHE001",
              attempts: times,
            });
            return null; // Stop retrying
          }

          // Exponential backoff: 100ms, 200ms, 400ms, 800ms, etc.
          const delay = Math.min(100 * Math.pow(2, times - 1), 5000);
          logger.info("Retrying Redis connection", {
            code: "CACHE001",
            attempt: times,
            delayMs: delay,
          });
          return delay;
        },
        lazyConnect: true,
      };

      this.client = new Redis(redisOptions);

      // Set up event handlers
      this.client.on("connect", () => {
        logger.info("Redis client connected", {
          host: this.config.host,
          port: this.config.port,
        });
        this.connected = true;
      });

      this.client.on("ready", () => {
        logger.info("Redis client ready", {
          host: this.config.host,
          port: this.config.port,
        });
      });

      this.client.on("error", (error: Error) => {
        logger.error("Redis client error", {
          code: "CACHE001",
          error: error.message,
        });
      });

      this.client.on("close", () => {
        logger.warn("Redis client connection closed");
        this.connected = false;
      });

      this.client.on("reconnecting", () => {
        logger.info("Redis client reconnecting");
      });

      // Attempt initial connection
      await this.client.connect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Redis connection failed, continuing in database-only mode", {
        code: "CACHE001",
        error: errorMessage,
      });

      // Clean up failed client
      if (this.client) {
        try {
          await this.client.quit();
        } catch {
          // Ignore cleanup errors
        }
        this.client = null;
      }

      // Continue in database-only mode - do not throw
      this.connected = false;
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Disconnect from Redis/Memurai
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info("Redis client disconnected");
      } catch (error) {
        logger.error("Error disconnecting Redis client", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        this.client = null;
        this.connected = false;
      }
    }
  }

  /**
   * Check if client is connected to Redis
   */
  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  /**
   * Check if Redis is enabled in configuration
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the underlying Redis client instance
   * Returns null if Redis is disabled or not connected
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Get the key prefix for namespacing cache keys
   */
  getKeyPrefix(): string {
    return this.config.keyPrefix;
  }
}

/**
 * Create Redis client instance from config
 */
function createRedisClient(): IRedisClient {
  const client = new RedisClient(redisConfig);
  return client;
}

/**
 * Singleton Redis client instance
 * Export for use throughout the backend
 */
export const redisClient: IRedisClient = createRedisClient();