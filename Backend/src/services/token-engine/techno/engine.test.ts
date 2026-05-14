import { describe, it, expect } from "vitest";
import { TechnoTokenEngine } from "./engine";
import { HealthBenefit } from "@prisma/client";

describe("TechnoTokenEngine", () => {
  const engine = new TechnoTokenEngine();

  describe("Property 6: Techno Project-Token Conversion", () => {
    it("should convert projects to tokens 1:1", () => {
      expect(engine.calculateTokens(0)).toBe(0);
      expect(engine.calculateTokens(10)).toBe(10);
      expect(engine.calculateTokens(25)).toBe(25);
    });
  });

  describe("Property 4: Techno Tier Calculation", () => {
    it("returns SAPHIRE at 0 projects", () => {
      expect(engine.calculateTier(0).tier).toBe("SAPHIRE");
    });
    
    it("returns SAPHIRE at 24 projects", () => {
      expect(engine.calculateTier(24).tier).toBe("SAPHIRE");
    });

    it("returns EMERALD at 25 projects (boundary)", () => {
      expect(engine.calculateTier(25).tier).toBe("EMERALD");
    });

    it("returns RUBY at 50 projects (boundary)", () => {
      expect(engine.calculateTier(50).tier).toBe("RUBY");
    });
    
    it("returns RUBY at 51 projects", () => {
      expect(engine.calculateTier(51).tier).toBe("RUBY");
    });

    it("returns DIAMOND at 75 projects (boundary)", () => {
      expect(engine.calculateTier(75).tier).toBe("DIAMOND");
    });
    
    it("returns DIAMOND at 76 projects", () => {
      expect(engine.calculateTier(76).tier).toBe("DIAMOND");
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

  describe("Techno Evaluation Period (6-monthly)", () => {
    it("should correctly identify P1", () => {
      const date = new Date(2026, 3, 10); // Apr 10, 2026
      const period = engine.getCurrentPeriod(date);
      expect(period.start.getFullYear()).toBe(2025); // Dec 16 previous year
      expect(period.start.getMonth()).toBe(11);
      expect(period.end.getFullYear()).toBe(2026);
      expect(period.end.getMonth()).toBe(5); // June
      expect(period.end.getDate()).toBe(15);
    });

    it("should correctly identify P2", () => {
      const date = new Date(2026, 8, 10); // Sep 10, 2026
      const period = engine.getCurrentPeriod(date);
      expect(period.start.getFullYear()).toBe(2026);
      expect(period.start.getMonth()).toBe(5); // June
      expect(period.start.getDate()).toBe(16);
      expect(period.end.getFullYear()).toBe(2026);
      expect(period.end.getMonth()).toBe(11); // Dec
      expect(period.end.getDate()).toBe(15);
    });
  });
});
