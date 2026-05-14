/**
 * Backend/src/domain/token-engine/opcent/engine.test.ts
 *
 * Unit tests for Opcent/Tele token engine.
 * Tests boundary values and business rules.
 */

import { describe, it, expect } from "vitest";
import { 
  calculateOpcentTier, 
  getOpcentPeriodDates, 
  isWithinOpcentEvaluationPeriod,
  getOpcentEvaluationDeadline,
  OpcentTokenEngine 
} from "./engine";

describe("OpcentTokenEngine", () => {
  describe("calculateOpcentTier", () => {
    it("returns SAPHIRE when slots = 0", () => {
      expect(calculateOpcentTier(0)).toBe("SAPHIRE");
    });

    it("returns SAPHIRE when slots = 429 (boundary - 1)", () => {
      expect(calculateOpcentTier(429)).toBe("SAPHIRE");
    });

    it("returns EMERALD when slots = 430 (boundary)", () => {
      expect(calculateOpcentTier(430)).toBe("EMERALD");
    });

    it("returns EMERALD when slots = 500", () => {
      expect(calculateOpcentTier(500)).toBe("EMERALD");
    });

    it("returns RUBY when slots = 860 (boundary)", () => {
      expect(calculateOpcentTier(860)).toBe("RUBY");
    });

    it("returns RUBY when slots = 1000", () => {
      expect(calculateOpcentTier(1000)).toBe("RUBY");
    });

    it("returns DIAMOND when slots = 1300 (boundary)", () => {
      expect(calculateOpcentTier(1300)).toBe("DIAMOND");
    });

    it("returns DIAMOND when slots = 1500", () => {
      expect(calculateOpcentTier(1500)).toBe("DIAMOND");
    });

    it("handles large numbers correctly", () => {
      expect(calculateOpcentTier(10000)).toBe("DIAMOND");
    });
  });

  describe("getOpcentPeriodDates", () => {
    it("returns P1 for dates in December", () => {
      const decDate = new Date(2025, 11, 20); // Dec 20, 2025
      const result = getOpcentPeriodDates(decDate);
      expect(result.period).toBe("P1");
    });

    it("returns P1 for dates in January-June", () => {
      const janDate = new Date(2026, 0, 15); // Jan 15, 2026
      const result = getOpcentPeriodDates(janDate);
      expect(result.period).toBe("P1");
    });

    it("returns P2 for dates in July-December 15", () => {
      const julDate = new Date(2026, 6, 15); // Jul 15, 2026
      const result = getOpcentPeriodDates(julDate);
      expect(result.period).toBe("P2");
    });

    it("calculates days remaining correctly", () => {
      const junDate = new Date(2026, 5, 1); // Jun 1, 2026
      const result = getOpcentPeriodDates(junDate);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.daysRemaining).toBeLessThan(200);
    });
  });

  describe("isWithinOpcentEvaluationPeriod", () => {
    it("returns true during P1", () => {
      const date = new Date(2026, 3, 15); // Apr 15, 2026
      expect(isWithinOpcentEvaluationPeriod(date)).toBe(true);
    });

    it("returns true during P2", () => {
      const date = new Date(2026, 9, 15); // Oct 15, 2026
      expect(isWithinOpcentEvaluationPeriod(date)).toBe(true);
    });

    it("returns false after Dec 15", () => {
      const date = new Date(2026, 11, 20); // Dec 20, 2026
      expect(isWithinOpcentEvaluationPeriod(date)).toBe(false);
    });
  });

  describe("getOpcentEvaluationDeadline", () => {
    it("returns Dec 15 of current year", () => {
      const date = new Date(2026, 5, 1); // Jun 1, 2026
      const deadline = getOpcentEvaluationDeadline(date);
      expect(deadline.getMonth()).toBe(11); // December
      expect(deadline.getDate()).toBe(15);
      expect(deadline.getFullYear()).toBe(2026);
    });
  });

  describe("OpcentTokenEngine.calculate", () => {
    const engine = new OpcentTokenEngine();

    it("calculates correct result for Saphire tier", () => {
      const result = engine.calculate(0);
      expect(result.tier).toBe("SAPHIRE");
      expect(result.healthBenefit).toBe("NONE");
      expect(result.pointsToNextTier).toBe(430);
    });

    it("calculates correct result for Emerald tier", () => {
      const result = engine.calculate(430);
      expect(result.tier).toBe("EMERALD");
      expect(result.healthBenefit).toBe("FIT");
      expect(result.pointsToNextTier).toBe(430);
    });

    it("calculates correct result for Ruby tier", () => {
      const result = engine.calculate(860);
      expect(result.tier).toBe("RUBY");
      expect(result.healthBenefit).toBe("FIT");
      expect(result.pointsToNextTier).toBe(440);
    });

    it("calculates correct result for Diamond tier", () => {
      const result = engine.calculate(1300);
      expect(result.tier).toBe("DIAMOND");
      expect(result.healthBenefit).toBe("CLASSY");
      expect(result.pointsToNextTier).toBe(null);
    });

    it("includes evaluation deadline", () => {
      const result = engine.calculate(100);
      expect(result.evaluationDeadline).toBeInstanceOf(Date);
      expect(result.evaluationDeadline!.getMonth()).toBe(11);
      expect(result.evaluationDeadline!.getDate()).toBe(15);
    });
  });

  describe("OpcentTokenEngine.validateSlotCount", () => {
    const engine = new OpcentTokenEngine();

    it("accepts valid positive integers", () => {
      expect(engine.validateSlotCount(0)).toEqual({ valid: true });
      expect(engine.validateSlotCount(100)).toEqual({ valid: true });
      expect(engine.validateSlotCount(1000)).toEqual({ valid: true });
    });

    it("rejects negative numbers", () => {
      expect(engine.validateSlotCount(-1)).toEqual({ 
        valid: false, 
        error: "Slot count cannot be negative" 
      });
    });

    it("rejects non-integers", () => {
      expect(engine.validateSlotCount(10.5)).toEqual({ 
        valid: false, 
        error: "Slot count must be a whole number" 
      });
    });
  });

  describe("OpcentTokenEngine.calculateShiftTokens", () => {
    const engine = new OpcentTokenEngine();

    it("returns correct token count (1:1 ratio)", () => {
      expect(engine.calculateShiftTokens(1)).toBe(1);
      expect(engine.calculateShiftTokens(5)).toBe(5);
      expect(engine.calculateShiftTokens(10)).toBe(10);
    });

    it("throws on invalid input", () => {
      expect(() => engine.calculateShiftTokens(-1)).toThrow("Slot count cannot be negative");
      expect(() => engine.calculateShiftTokens(1.5)).toThrow("Slot count must be a whole number");
    });
  });
});