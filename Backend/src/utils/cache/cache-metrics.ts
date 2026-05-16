/**
 * Cache Metrics interface
 */
export interface ICacheMetrics {
  recordHit(timeMs: number): void;
  recordMiss(timeMs: number): void;
  recordError(): void;
}

export class CacheMetrics implements ICacheMetrics {
  private hits = 0;
  private misses = 0;
  private errors = 0;
  private totalTimeMs = 0;
  private operationCount = 0;
  private windowStart: Date;

  constructor() {
    this.windowStart = new Date();
  }

  recordHit(timeMs: number) {
    this.checkWindow();
    this.hits++;
    this.totalTimeMs += timeMs;
    this.operationCount++;
  }

  recordMiss(timeMs: number) {
    this.checkWindow();
    this.misses++;
    this.totalTimeMs += timeMs;
    this.operationCount++;
  }

  recordError() {
    this.checkWindow();
    this.errors++;
  }

  private checkWindow() {
    const now = new Date();
    // 1-minute rolling window reset
    if (now.getTime() - this.windowStart.getTime() > 60000) {
      this.logMetrics();
      this.hits = 0;
      this.misses = 0;
      this.errors = 0;
      this.totalTimeMs = 0;
      this.operationCount = 0;
      this.windowStart = now;
    }
  }

  private logMetrics() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.misses / totalRequests : 0;
    const avgResponseTime = this.operationCount > 0 ? this.totalTimeMs / this.operationCount : 0;

    console.log(JSON.stringify({
      level: "info",
      type: "cache_metrics",
      cache_hit_rate: hitRate.toFixed(2),
      cache_miss_rate: missRate.toFixed(2),
      average_response_time_ms: avgResponseTime.toFixed(2),
      error_count: this.errors,
      window_start: this.windowStart.toISOString(),
      service_name: "loyalty-backend",
    }));
  }
}

export const cacheMetrics = new CacheMetrics();