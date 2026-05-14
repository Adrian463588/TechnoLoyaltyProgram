import { describe, it, expect } from "vitest";
import { calculateDowngrade, calculateReset } from "./downgrade.domain";

describe("Membership Downgrade Domain Logic", () => {
  describe("Opcent / Tele Downgrade", () => {
    it("deducts 50% (floored) of current balance and downgrades one tier", () => {
      const result1 = calculateDowngrade("OPCENT", "DIAMOND", 1305, "no_slots_3_consecutive_months_inactive");
      expect(result1.penaltyAmount).toBe(652); // Math.floor(1305 * 0.5)
      expect(result1.newTier).toBe("RUBY");

      const result2 = calculateDowngrade("TELE", "EMERALD", 450, "no_slots_3_consecutive_months_inactive");
      expect(result2.penaltyAmount).toBe(225);
      expect(result2.newTier).toBe("SAPHIRE");
      
      const result3 = calculateDowngrade("OPCENT", "SAPHIRE", 100, "no_slots_3_consecutive_months_inactive");
      expect(result3.penaltyAmount).toBe(50);
      expect(result3.newTier).toBe("SAPHIRE"); // Cannot go lower than SAPHIRE
    });

    it("throws error for invalid trigger", () => {
      expect(() => {
        calculateDowngrade("OPCENT", "DIAMOND", 1000, "invalid_trigger" as any);
      }).toThrowError("Invalid downgrade trigger");
    });
  });

  describe("Techno Downgrade", () => {
    it("returns PENDING_STAKEHOLDER_CONFIRMATION due to OQ-01", () => {
      const result = calculateDowngrade("TECHNO", "RUBY", 50, "rejected_3_projects_within_6_month_window");
      expect(result.penaltyAmount).toBe("PENDING_STAKEHOLDER_CONFIRMATION");
      expect(result.newTier).toBe("PENDING_STAKEHOLDER_CONFIRMATION");
    });
  });
});

describe("Membership Reset Domain Logic", () => {
  describe("Opcent / Tele Reset", () => {
    it("deducts 100% of current balance and resets to SAPHIRE", () => {
      const result = calculateReset("OPCENT", "DIAMOND", 1500, "no_slots_3_consecutive_months_fully_unavailable");
      expect(result.penaltyAmount).toBe(1500);
      expect(result.newTier).toBe("SAPHIRE");
    });
  });

  describe("Techno Reset", () => {
    it("returns PENDING_STAKEHOLDER_CONFIRMATION", () => {
      const result = calculateReset("TECHNO", "DIAMOND", 100, "rejected_3_projects_within_6_month_window" as any);
      expect(result.penaltyAmount).toBe("PENDING_STAKEHOLDER_CONFIRMATION");
      expect(result.newTier).toBe("PENDING_STAKEHOLDER_CONFIRMATION");
    });
  });
});
