import { describe, it, expect } from "vitest";
import { OpcentTeleTokenEngine } from "./engine";
import { HealthBenefit } from "@prisma/client";

describe("OpcentTeleTokenEngine", () => {
  const engine = new OpcentTeleTokenEngine();

  describe("Property 5: Opcent Slot-Token Conversion", () => {
    it("should convert slots to tokens 1:1", () => {
      expect(engine.calculateTokens(0)).toBe(0);
      expect(engine.calculateTokens(10)).toBe(10);
      expect(engine.calculateTokens(430)).toBe(430);
    });
  });

  describe("Property 3: Opcent Tier Calculation", () => {
    it("returns SAPHIRE at 0 slots", () => {
      expect(engine.calculateTier(0).tier).toBe("SAPHIRE");
    });
    
    it("returns SAPHIRE at 429 slots", () => {
      expect(engine.calculateTier(429).tier).toBe("SAPHIRE");
    });

    it("returns EMERALD at 430 slots (boundary)", () => {
      expect(engine.calculateTier(430).tier).toBe("EMERALD");
    });

    it("returns RUBY at 860 slots (boundary)", () => {
      expect(engine.calculateTier(860).tier).toBe("RUBY");
    });
    
    it("returns RUBY at 861 slots", () => {
      expect(engine.calculateTier(861).tier).toBe("RUBY");
    });

    it("returns DIAMOND at 1300 slots (boundary)", () => {
      expect(engine.calculateTier(1300).tier).toBe("DIAMOND");
    });
    
    it("returns DIAMOND at 1301 slots", () => {
      expect(engine.calculateTier(1301).tier).toBe("DIAMOND");
    });
  });

  describe("Property 11: Health Benefit Mapping", () => {
    it("returns NONE for SAPHIRE", () => {
      expect(engine.getHealthBenefit("SAPHIRE")).toBe(HealthBenefit.NONE);
    });

    it("returns FIT for EMERALD and RUBY", () => {
      expect(engine.getHealthBenefit("EMERALD")).toBe(HealthBenefit.FIT);
      expect(engine.getHealthBenefit("RUBY")).toBe(HealthBenefit.FIT);
    });

    it("returns CLASSY for DIAMOND", () => {
      expect(engine.getHealthBenefit("DIAMOND")).toBe(HealthBenefit.CLASSY);
    });
  });

  describe("Property 12: Opcent Evaluation Deadline", () => {
    it("should correctly identify current period before Dec 16", () => {
      const date = new Date(2026, 10, 15); // Nov 15, 2026
      const period = engine.getCurrentPeriod(date);
      expect(period.start.getFullYear()).toBe(2025);
      expect(period.end.getFullYear()).toBe(2026);
      expect(period.end.getMonth()).toBe(11); // Dec
      expect(period.end.getDate()).toBe(15);
    });

    it("should correctly identify current period after Dec 15", () => {
      const date = new Date(2026, 11, 20); // Dec 20, 2026
      const period = engine.getCurrentPeriod(date);
      expect(period.start.getFullYear()).toBe(2026);
      expect(period.end.getFullYear()).toBe(2027);
    });

    it("should return true for isWithinEvaluationPeriod with current date", () => {
      expect(engine.isWithinEvaluationPeriod(new Date())).toBe(true);
    });
  });
});
