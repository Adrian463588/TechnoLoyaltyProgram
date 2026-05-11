/**
 * Unit tests for the Period Service.
 */

import { describe, it, expect } from "vitest";
import {
  getActivePeriod,
  isCutOffDate,
  getDaysUntilCutOff,
  getPeriodProgressPercent,
} from "./period.service";

describe("getActivePeriod", () => {
  it("correctly identifies P2 2025 for a date in October 2025", () => {
    const period = getActivePeriod(new Date("2025-10-01"));
    expect(period.id).toBe("P2");
    expect(period.year).toBe(2025);
  });

  it("correctly identifies P1 2026 for a date in March 2026", () => {
    const period = getActivePeriod(new Date("2026-03-15"));
    expect(period.id).toBe("P1");
    expect(period.year).toBe(2026);
  });

  it("P2 starts exactly on June 16", () => {
    const period = getActivePeriod(new Date("2026-06-16T00:00:00Z"));
    expect(period.id).toBe("P2");
  });

  it("P1 ends on June 15", () => {
    const period = getActivePeriod(new Date("2026-06-15T12:00:00Z"));
    expect(period.id).toBe("P1");
  });

  it("P2 ends on December 15", () => {
    const period = getActivePeriod(new Date("2026-12-15T12:00:00Z"));
    expect(period.id).toBe("P2");
  });

  it("P1 of next year starts on December 16", () => {
    const period = getActivePeriod(new Date("2026-12-16T00:00:00Z"));
    expect(period.id).toBe("P1");
    expect(period.year).toBe(2027);
  });
});

describe("isCutOffDate", () => {
  it("returns true for June 15", () => {
    expect(isCutOffDate(new Date("2026-06-15"))).toBe(true);
  });

  it("returns true for December 15", () => {
    expect(isCutOffDate(new Date("2026-12-15"))).toBe(true);
  });

  it("returns false for June 16", () => {
    expect(isCutOffDate(new Date("2026-06-16"))).toBe(false);
  });

  it("returns false for December 16", () => {
    expect(isCutOffDate(new Date("2026-12-16"))).toBe(false);
  });
});

describe("getDaysUntilCutOff", () => {
  it("returns a positive number during an active period", () => {
    const days = getDaysUntilCutOff(new Date("2026-03-01"));
    expect(days).toBeGreaterThan(0);
  });

  it("returns 0 on cut-off date", () => {
    const days = getDaysUntilCutOff(new Date("2026-06-15T23:59:59Z"));
    expect(days).toBe(0);
  });
});

describe("getPeriodProgressPercent", () => {
  it("returns a value between 0 and 100", () => {
    const pct = getPeriodProgressPercent(new Date("2026-03-01"));
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it("returns near 100% close to cut-off", () => {
    const pct = getPeriodProgressPercent(new Date("2026-06-14"));
    expect(pct).toBeGreaterThan(95);
  });
});
