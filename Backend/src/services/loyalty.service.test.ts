import { describe, it, expect } from "vitest";
import { determineTier, getNextTier, checkRedemptionEligibility } from "./loyalty.service";
import { MemberTierType, PartnershipStatus, DivisionType } from "@prisma/client";

describe("Loyalty Engine — Pure Logic", () => {
  describe("determineTier", () => {
    it("should calculate correct tier for OPCENT", () => {
      expect(determineTier(DivisionType.OPCENT, 0)).toBe(MemberTierType.SAPHIRE);
      expect(determineTier(DivisionType.OPCENT, 429)).toBe(MemberTierType.SAPHIRE); // Boundary
      expect(determineTier(DivisionType.OPCENT, 430)).toBe(MemberTierType.EMERALD);
      expect(determineTier(DivisionType.OPCENT, 859)).toBe(MemberTierType.EMERALD); // Boundary
      expect(determineTier(DivisionType.OPCENT, 860)).toBe(MemberTierType.RUBY);
      expect(determineTier(DivisionType.OPCENT, 1299)).toBe(MemberTierType.RUBY); // Boundary
      expect(determineTier(DivisionType.OPCENT, 1300)).toBe(MemberTierType.DIAMOND);
    });

    it("should calculate correct tier for TECHNO", () => {
      expect(determineTier(DivisionType.TECHNO, 0)).toBe(MemberTierType.SAPHIRE);
      expect(determineTier(DivisionType.TECHNO, 24)).toBe(MemberTierType.SAPHIRE); // Boundary
      expect(determineTier(DivisionType.TECHNO, 25)).toBe(MemberTierType.EMERALD);
      expect(determineTier(DivisionType.TECHNO, 49)).toBe(MemberTierType.EMERALD); // Boundary
      expect(determineTier(DivisionType.TECHNO, 50)).toBe(MemberTierType.RUBY);
      expect(determineTier(DivisionType.TECHNO, 74)).toBe(MemberTierType.RUBY); // Boundary
      expect(determineTier(DivisionType.TECHNO, 75)).toBe(MemberTierType.DIAMOND);
    });
  });

  describe("getNextTier", () => {
    it("should return correct next tier", () => {
      expect(getNextTier(MemberTierType.SAPHIRE)).toBe(MemberTierType.EMERALD);
      expect(getNextTier(MemberTierType.EMERALD)).toBe(MemberTierType.RUBY);
      expect(getNextTier(MemberTierType.RUBY)).toBe(MemberTierType.DIAMOND);
      expect(getNextTier(MemberTierType.DIAMOND)).toBeNull();
    });
  });

  describe("checkRedemptionEligibility", () => {
    const base = {
      tokenBalance: 2000,
      rewardTokenCost: 1000,
      partnerStatus: PartnershipStatus.ACTIVE,
      isItemActive: true,
    };

    it("should allow if all conditions met", () => {
      const result = checkRedemptionEligibility(base);
      expect(result.isEligible).toBe(true);
    });

    it("should block if resigned", () => {
      const result = checkRedemptionEligibility({ ...base, partnerStatus: PartnershipStatus.RESIGNED });
      expect(result.isEligible).toBe(false);
    });

    it("should block if insufficient tokens", () => {
      const result = checkRedemptionEligibility({ ...base, tokenBalance: 500, rewardTokenCost: 2000 });
      expect(result.isEligible).toBe(false);
    });
  });
});
