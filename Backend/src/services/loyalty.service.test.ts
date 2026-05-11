/**
 * Unit tests for the Loyalty Engine domain services.
 * Run with: npx vitest run src/server/services/loyalty.service.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  determineTier,
  getNextTier,
  getPointsToNextTier,
  calculateOptelTokens,
  calculateTechnoTokens,
  checkDowngrade,
  checkReset,
  checkRedemptionEligibility,
} from "./loyalty.service";

describe("determineTier", () => {
  it("returns BRONZE for 0 tokens", () => {
    expect(determineTier(0)).toBe("BRONZE");
  });
  it("returns BRONZE for 999 tokens", () => {
    expect(determineTier(999)).toBe("BRONZE");
  });
  it("returns SILVER for exactly 1000 tokens", () => {
    expect(determineTier(1000)).toBe("SILVER");
  });
  it("returns SILVER for 2999 tokens", () => {
    expect(determineTier(2999)).toBe("SILVER");
  });
  it("returns GOLD for exactly 3000 tokens", () => {
    expect(determineTier(3000)).toBe("GOLD");
  });
  it("returns GOLD for 5999 tokens", () => {
    expect(determineTier(5999)).toBe("GOLD");
  });
  it("returns PLATINUM for exactly 6000 tokens", () => {
    expect(determineTier(6000)).toBe("PLATINUM");
  });
  it("returns PLATINUM for very large values", () => {
    expect(determineTier(999999)).toBe("PLATINUM");
  });
});

describe("getNextTier", () => {
  it("returns SILVER from BRONZE", () => {
    expect(getNextTier("BRONZE")).toBe("SILVER");
  });
  it("returns GOLD from SILVER", () => {
    expect(getNextTier("SILVER")).toBe("GOLD");
  });
  it("returns PLATINUM from GOLD", () => {
    expect(getNextTier("GOLD")).toBe("PLATINUM");
  });
  it("returns null from PLATINUM", () => {
    expect(getNextTier("PLATINUM")).toBeNull();
  });
});

describe("getPointsToNextTier", () => {
  it("returns 1000 when at 0 tokens (Bronze → Silver)", () => {
    expect(getPointsToNextTier(0)).toBe(1000);
  });
  it("returns 2000 when at 1000 tokens (Silver → Gold needs 3000)", () => {
    expect(getPointsToNextTier(1000)).toBe(2000);
  });
  it("returns 0 when at Platinum", () => {
    expect(getPointsToNextTier(6000)).toBe(0);
    expect(getPointsToNextTier(10000)).toBe(0);
  });
});

describe("calculateOptelTokens", () => {
  it("calculates tokens correctly for active employee", () => {
    expect(
      calculateOptelTokens({
        npk: "EMP001",
        slots: 10,
        regularSlots: 10,
        totalSlots: 10,
        partnershipStatus: "ACTIVE",
        isResigned: false,
      })
    ).toBe(1000);
  });

  it("returns 0 for resigned employee", () => {
    expect(
      calculateOptelTokens({
        npk: "EMP002",
        slots: 10,
        regularSlots: 10,
        totalSlots: 10,
        partnershipStatus: "ACTIVE",
        isResigned: true,
      })
    ).toBe(0);
  });

  it("returns 0 for inactive partnership", () => {
    expect(
      calculateOptelTokens({
        npk: "EMP003",
        slots: 5,
        regularSlots: 5,
        totalSlots: 5,
        partnershipStatus: "INACTIVE",
        isResigned: false,
      })
    ).toBe(0);
  });
});

describe("calculateTechnoTokens", () => {
  it("calculates tokens correctly for active employee", () => {
    expect(
      calculateTechnoTokens({
        npk: "EMP004",
        monthlySprints: [5],
        totalSprintPerPeriod: 5,
        projectRejections: 0,
        partnershipStatus: "ACTIVE",
        isResigned: false,
      })
    ).toBe(1000);
  });

  it("deducts tokens for project rejections", () => {
    // 5 sprints - 2 rejections = 3 effective sprints * 200 = 600
    expect(
      calculateTechnoTokens({
        npk: "EMP005",
        monthlySprints: [5],
        totalSprintPerPeriod: 5,
        projectRejections: 2,
        partnershipStatus: "ACTIVE",
        isResigned: false,
      })
    ).toBe(600);
  });

  it("does not go below 0 from too many rejections", () => {
    expect(
      calculateTechnoTokens({
        npk: "EMP006",
        monthlySprints: [2],
        totalSprintPerPeriod: 2,
        projectRejections: 10,
        partnershipStatus: "ACTIVE",
        isResigned: false,
      })
    ).toBe(0);
  });
});

describe("checkDowngrade", () => {
  it("does not downgrade for good performance", () => {
    const result = checkDowngrade({
      currentTier: "GOLD",
      projectRejections: 1,
      missedSlots: 0,
      periodTokens: 1000,
    });
    expect(result.shouldDowngrade).toBe(false);
  });

  it("triggers downgrade for 3+ rejections", () => {
    const result = checkDowngrade({
      currentTier: "GOLD",
      projectRejections: 3,
      missedSlots: 0,
      periodTokens: 1000,
    });
    expect(result.shouldDowngrade).toBe(true);
    expect(result.toTier).toBe("SILVER");
  });

  it("does not downgrade BRONZE further", () => {
    const result = checkDowngrade({
      currentTier: "BRONZE",
      projectRejections: 5,
      missedSlots: 0,
      periodTokens: 0,
    });
    // Already at lowest tier — toTier would equal fromTier
    expect(result.fromTier).toBe("BRONZE");
    expect(result.toTier).toBe("BRONZE");
    expect(result.shouldDowngrade).toBe(false);
  });
});

describe("checkReset", () => {
  it("resets on resignation", () => {
    const result = checkReset({ consecutiveLowPeriods: 0, isInactive: false, isResigned: true });
    expect(result.shouldReset).toBe(true);
  });

  it("resets after 2 consecutive low periods", () => {
    const result = checkReset({ consecutiveLowPeriods: 2, isInactive: false, isResigned: false });
    expect(result.shouldReset).toBe(true);
  });

  it("does not reset for 1 low period", () => {
    const result = checkReset({ consecutiveLowPeriods: 1, isInactive: false, isResigned: false });
    expect(result.shouldReset).toBe(false);
  });
});

describe("checkRedemptionEligibility", () => {
  const base = {
    totalTokens: 5000,
    rewardTokenCost: 2000,
    partnershipStatus: "ACTIVE" as const,
    isResigned: false,
    memberStatus: "ACTIVE" as const,
  };

  it("allows eligible employee to redeem", () => {
    const result = checkRedemptionEligibility(base);
    expect(result.isEligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("rejects resigned employee", () => {
    const result = checkRedemptionEligibility({ ...base, isResigned: true });
    expect(result.isEligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("Resigned"))).toBe(true);
  });

  it("rejects when insufficient tokens", () => {
    const result = checkRedemptionEligibility({ ...base, totalTokens: 500, rewardTokenCost: 2000 });
    expect(result.isEligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("Insufficient"))).toBe(true);
  });

  it("rejects when status is RESET", () => {
    const result = checkRedemptionEligibility({ ...base, memberStatus: "RESET" });
    expect(result.isEligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("reset"))).toBe(true);
  });
});
