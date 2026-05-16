import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CacheMetrics } from "./cache-metrics";

describe("CacheMetrics", () => {
  let metrics: CacheMetrics;
  let consoleSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();
    // Set a consistent start time for the window
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    
    metrics = new CacheMetrics();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should record hits and not log if window is less than 60s", () => {
    metrics.recordHit(10);
    metrics.recordHit(20);
    
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should record misses and not log if window is less than 60s", () => {
    metrics.recordMiss(15);
    
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should record errors and not log if window is less than 60s", () => {
    metrics.recordError();
    
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should calculate and log correct metrics after 60s window", () => {
    // Record some hits and misses
    metrics.recordHit(10); // hit 1
    metrics.recordHit(20); // hit 2
    metrics.recordMiss(30); // miss 1
    metrics.recordError(); // error 1
    
    // Total operations: 3 (hits + misses)
    // Total time: 60ms
    // Average time: 20ms
    // Hit rate: 2/3 = 0.67
    // Miss rate: 1/3 = 0.33
    
    // Advance time by 61 seconds
    vi.advanceTimersByTime(61000);
    
    // Trigger window check by recording another metric
    metrics.recordHit(15);
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    
    const logOutput = JSON.parse(consoleSpy.mock.calls[0][0]);
    
    expect(logOutput).toMatchObject({
      level: "info",
      type: "cache_metrics",
      cache_hit_rate: "0.67",
      cache_miss_rate: "0.33",
      average_response_time_ms: "20.00",
      error_count: 1,
      window_start: "2026-01-01T00:00:00.000Z",
      service_name: "loyalty-backend",
    });
  });

  it("should reset metrics after logging", () => {
    metrics.recordHit(10);
    
    // Advance time to pass the first window
    vi.advanceTimersByTime(61000);
    
    // This will trigger the logging for window 1 and start window 2
    metrics.recordHit(15);
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockClear();
    
    // Advance time to pass the second window
    vi.advanceTimersByTime(61000);
    
    // This will trigger the logging for window 2
    metrics.recordError();
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    
    const logOutput = JSON.parse(consoleSpy.mock.calls[0][0]);
    
    // Window 2 only had one hit (from line 67)
    expect(logOutput).toMatchObject({
      cache_hit_rate: "1.00",
      cache_miss_rate: "0.00",
      average_response_time_ms: "15.00",
      error_count: 0,
    });
  });

  it("should handle empty window logging gracefully", () => {
    // Advance time to pass the first window without any operations
    vi.advanceTimersByTime(61000);
    
    // This will trigger the logging for window 1 (which had no operations)
    metrics.recordHit(10);
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    
    const logOutput = JSON.parse(consoleSpy.mock.calls[0][0]);
    
    expect(logOutput).toMatchObject({
      cache_hit_rate: "0.00",
      cache_miss_rate: "0.00",
      average_response_time_ms: "0.00",
      error_count: 0,
    });
  });
});
