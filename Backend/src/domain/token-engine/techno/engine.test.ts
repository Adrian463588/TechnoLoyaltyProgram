/**
 * Backend/src/domain/token-engine/techno/engine.test.ts
 *
 * Unit tests for Techno token engine.
 * Tests boundary values and business rules.
 */

import { describe, it, expect } from "vitest";
import { 
  calculateTechnoTier, 
  getTechnoPeriodDates, 
  isWithinTechnoEvaluationPeriod,
  getTechnoEvaluationDeadline,
  TechnoTokenEngine 
} from "./engine";

describe("TechnoTokenEngine", () => {
  describe("calculateTechnoTier", () => {
    it("returns SAPHIRE when projects = 0", () => {
      expect(calculateTechnoTier(0)).toBe("SAPHIRE");
    });

    it("returns SAPHIRE when projects = 24 (boundary - 1)", () => {
      expect(calculateTechnoTier(24)).toBe("SAPHIRE");
    });

    it("returns EMERALD when projects = 25 (boundary)", () => {
      expect(calculateTechnoTier(25)).toBe("EMERALD");
    });

    it("returns EMERALD when projects = 30", () => {
      expect(calculateTechnoTier(30)).toBe("EMERALD");
    });

    it("returns RUBY when projects = 50 (boundary)", () => {
      expect(calculateTechnoTier(50)).toBe("RUBY");
    });

    it("returns RUBY when projects = 60", () => {
      expect(calculateTechnoTier(60)).toBe("RUBY");
    });

    it("returns DIAMOND when projects = 75 (boundary)", () => {
      expect(calculateTechnoTier(75)).toBe("DIAMOND");
    });

    it("returns DIAMOND when projects = 100", () => {
      expect(calculateTechnoTier(100)).toBe("DIAMOND");
    });

    it("handles large numbers correctly", () => {
      expect(calculateTechnoTier(500)).toBe("DIAMOND");
    });
  });

  describe("getTechnoPeriodDates", () => {
    it("returns P1 for dates in December", () => {
      const decDate = new Date(2025, 11, 20); // Dec 20, 2025
      const result = getTechnoPeriodDates(decDate);
      expect(result.period).toBe("P1");
    });

    it("returns P1 for dates in January-June", () => {
      const janDate = new Date(2026, 0, 15); // Jan 15, 2026
      const result = getTechnoPeriodDates(janDate);
      expect(result.period).toBe("P1");
    });

    it("returns P2 for dates in July-December 15", () => {
      const julDate = new Date(2026, 6, 15); // Jul 15, 2026
      const result = getTechnoPeriodDates(julDate);
      expect(result.period).toBe("P2");
    });

    it("calculates days remaining correctly", () => {
      const junDate = new Date(2026, 5, 1); // Jun 1, 2026
      const result = getTechnoPeriodDates(junDate);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.monthsRemaining).toBeGreaterThan(0);
    });

    it("calculates months remaining correctly", () => {
      const julDate = new Date(2026, 6, 1); // Jul 1, 2026 — early in P2 (Jun 16 - Dec 15)
      const result = getTechnoPeriodDates(julDate);
      // P2 ends Dec 15, so about 5.5 months remaining from Jul 1
      expect(result.monthsRemaining).toBeGreaterThanOrEqual(5);
      expect(result.monthsRemaining).toBeLessThanOrEqual(6);
    });
  });

  describe("isWithinTechnoEvaluationPeriod", () => {
    it("returns true during P1", () => {
      const date = new Date(2026, 3, 15); // Apr 15, 2026
      expect(isWithinTechnoEvaluationPeriod(date)).toBe(true);
    });

    it("returns true during P2", () => {
      const date = new Date(2026, 9, 15); // Oct 15, 2026
      expect(isWithinTechnoEvaluationPeriod(date)).toBe(true);
    });

    it("returns false after Dec 15", () => {
      const date = new Date(2026, 11, 20); // Dec 20, 2026
      expect(isWithinTechnoEvaluationPeriod(date)).toBe(false);
    });
  });

  describe("getTechnoEvaluationDeadline", () => {
    it("returns Jun 15 for P1 dates", () => {
      const date = new Date(2026, 3, 15); // Apr 15, 2026
      const deadline = getTechnoEvaluationDeadline(date);
      expect(deadline.getMonth()).toBe(5); // June
      expect(deadline.getDate()).toBe(15);
      expect(deadline.getFullYear()).toBe(2026);
    });

    it("returns Dec 15 for P2 dates", () => {
      const date = new Date(2026, 9, 15); // Oct 15, 2026
      const deadline = getTechnoEvaluationDeadline(date);
      expect(deadline.getMonth()).toBe(11); // December
      expect(deadline.getDate()).toBe(15);
      expect(deadline.getFullYear()).toBe(2026);
    });
  });

  describe("TechnoTokenEngine.calculate", () => {
    const engine = new TechnoTokenEngine();

    it("calculates correct result for Saphire tier", () => {
      const result = engine.calculate(0);
      expect(result.tier).toBe("SAPHIRE");
      expect(result.healthBenefit).toBe("NONE");
      expect(result.pointsToNextTier).toBe(25);
    });

    it("calculates correct result for Emerald tier", () => {
      const result = engine.calculate(25);
      expect(result.tier).toBe("EMERALD");
      expect(result.healthBenefit).toBe("FIT");
      expect(result.pointsToNextTier).toBe(25);
    });

    it("calculates correct result for Ruby tier", () => {
      const result = engine.calculate(50);
      expect(result.tier).toBe("RUBY");
      expect(result.healthBenefit).toBe("FIT");
      expect(result.pointsToNextTier).toBe(25);
    });

    it("calculates correct result for Diamond tier", () => {
      const result = engine.calculate(75);
      expect(result.tier).toBe("DIAMOND");
      expect(result.healthBenefit).toBe("CLASSY");
      expect(result.pointsToNextTier).toBe(null);
    });

    it("includes evaluation deadline", () => {
      const result = engine.calculate(10);
      expect(result.evaluationDeadline).toBeInstanceOf(Date);
    });

    it("sets tokens equal to project count", () => {
      const result = engine.calculate(30);
      expect(result.tokens).toBe(30);
    });
  });

  describe("TechnoTokenEngine.validateProjectCount", () => {
    const engine = new TechnoTokenEngine();

    it("accepts valid positive integers", () => {
      expect(engine.validateProjectCount(0)).toEqual({ valid: true });
      expect(engine.validateProjectCount(25)).toEqual({ valid: true });
      expect(engine.validateProjectCount(100)).toEqual({ valid: true });
    });

    it("rejects negative numbers", () => {
      expect(engine.validateProjectCount(-1)).toEqual({ 
        valid: false, 
        error: "Project count cannot be negative" 
      });
    });

    it("rejects non-integers", () => {
      expect(engine.validateProjectCount(10.5)).toEqual({ 
        valid: false, 
        error: "Project count must be a whole number" 
      });
    });
  });

  describe("TechnoTokenEngine.calculateProjectTokens", () => {
    const engine = new TechnoTokenEngine();

    it("returns correct token count (1:1 ratio)", () => {
      expect(engine.calculateProjectTokens(1)).toBe(1);
      expect(engine.calculateProjectTokens(5)).toBe(5);
      expect(engine.calculateProjectTokens(10)).toBe(10);
    });

    it("throws on invalid input", () => {
      expect(() => engine.calculateProjectTokens(-1)).toThrow("Project count cannot be negative");
      expect(() => engine.calculateProjectTokens(1.5)).toThrow("Project count must be a whole number");
    });
  });
});