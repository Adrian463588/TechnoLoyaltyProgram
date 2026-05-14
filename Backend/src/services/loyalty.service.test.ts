import { describe, it, expect } from "vitest";
import { determineTier, getNextTier, checkRedemptionEligibility } from "./loyalty.service";
import { MembershipTier, PartnerStatus, Division } from "@prisma/client";

describe("Loyalty Engine — Pure Logic", () => {
  describe("determineTier", () => {
    it("should calculate correct tier for OPCENT", () => {
      expect(determineTier(Division.OPCENT, 0)).toBe(MembershipTier.SAPHIRE);
      expect(determineTier(Division.OPCENT, 429)).toBe(MembershipTier.SAPHIRE); // Boundary
      expect(determineTier(Division.OPCENT, 430)).toBe(MembershipTier.EMERALD);
      expect(determineTier(Division.OPCENT, 859)).toBe(MembershipTier.EMERALD); // Boundary
      expect(determineTier(Division.OPCENT, 860)).toBe(MembershipTier.RUBY);
      expect(determineTier(Division.OPCENT, 1299)).toBe(MembershipTier.RUBY); // Boundary
      expect(determineTier(Division.OPCENT, 1300)).toBe(MembershipTier.DIAMOND);
    });

    it("should calculate correct tier for TECHNO", () => {
      expect(determineTier(Division.TECHNO, 0)).toBe(MembershipTier.SAPHIRE);
      expect(determineTier(Division.TECHNO, 24)).toBe(MembershipTier.SAPHIRE); // Boundary
      expect(determineTier(Division.TECHNO, 25)).toBe(MembershipTier.EMERALD);
      expect(determineTier(Division.TECHNO, 49)).toBe(MembershipTier.EMERALD); // Boundary
      expect(determineTier(Division.TECHNO, 50)).toBe(MembershipTier.RUBY);
      expect(determineTier(Division.TECHNO, 74)).toBe(MembershipTier.RUBY); // Boundary
      expect(determineTier(Division.TECHNO, 75)).toBe(MembershipTier.DIAMOND);
    });
  });

  describe("getNextTier", () => {
    it("should return correct next tier", () => {
      expect(getNextTier(MembershipTier.SAPHIRE)).toBe(MembershipTier.EMERALD);
      expect(getNextTier(MembershipTier.EMERALD)).toBe(MembershipTier.RUBY);
      expect(getNextTier(MembershipTier.RUBY)).toBe(MembershipTier.DIAMOND);
      expect(getNextTier(MembershipTier.DIAMOND)).toBeNull();
    });
  });

  describe("checkRedemptionEligibility", () => {
    const base = {
      tokenBalance: 2000,
      rewardTokenCost: 1000,
      partnerStatus: PartnerStatus.ACTIVE,
      isItemActive: true,
    };

    it("should allow if all conditions met", () => {
      const result = checkRedemptionEligibility(base);
      expect(result.isEligible).toBe(true);
    });

    it("should block if resigned", () => {
      const result = checkRedemptionEligibility({ ...base, partnerStatus: PartnerStatus.RESIGNED });
      expect(result.isEligible).toBe(false);
    });

    it("should block if insufficient tokens", () => {
      const result = checkRedemptionEligibility({ ...base, tokenBalance: 500, rewardTokenCost: 2000 });
      expect(result.isEligible).toBe(false);
    });
  });
});
