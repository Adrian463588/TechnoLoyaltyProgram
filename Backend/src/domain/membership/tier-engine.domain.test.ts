/**
 * Backend/src/domain/membership/tier-engine.domain.test.ts
 *
 * Unit tests for tier-engine domain — INT-SPR22-001 through INT-SPR22-004.
 * Pure functions only — no DB, no mocks needed.
 *
 * Tests:
 *   INT-SPR22-001: calculateMembershipTier (Opcent thresholds)
 *   INT-SPR22-002: getNextTier / getPreviousTier ordering
 *   INT-SPR22-003: qualifiesForUpgrade — points-needed boundary
 *   INT-SPR22-004: isAtRiskOfDowngrade — inactivity rule
 */

import { describe, it, expect } from "vitest";
import { DivisionType, MemberTierType } from "@prisma/client";
import {
  calculateMembershipTier,
  getNextTier,
  getPreviousTier,
  qualifiesForUpgrade,
  isAtRiskOfDowngrade,
  isValidTierTransition,
  getTierDisplayName,
  TIER_ORDER,
} from "./tier-engine.domain";

// ── INT-SPR22-001: Opcent tier calculation ─────────────────────────────────
describe("INT-SPR22-001: calculateMembershipTier — Opcent", () => {
  it("returns SAPHIRE for 0 cumulative value", () => {
    expect(calculateMembershipTier(DivisionType.OPCENT, 0)).toBe(MemberTierType.SAPHIRE);
  });

  it("returns SAPHIRE just below EMERALD threshold", () => {
    expect(calculateMembershipTier(DivisionType.OPCENT, 429)).toBe(MemberTierType.SAPHIRE);
  });

  it("returns EMERALD at threshold 430", () => {
    expect(calculateMembershipTier(DivisionType.OPCENT, 430)).toBe(MemberTierType.EMERALD);
  });

  it("returns RUBY at threshold 860", () => {
    expect(calculateMembershipTier(DivisionType.OPCENT, 860)).toBe(MemberTierType.RUBY);
  });

  it("returns DIAMOND at threshold 1300", () => {
    expect(calculateMembershipTier(DivisionType.OPCENT, 1300)).toBe(MemberTierType.DIAMOND);
  });

  it("returns DIAMOND for values above threshold", () => {
    expect(calculateMembershipTier(DivisionType.OPCENT, 9999)).toBe(MemberTierType.DIAMOND);
  });
});

// ── INT-SPR22-001b: Techno tier calculation ────────────────────────────────
describe("INT-SPR22-001b: calculateMembershipTier — Techno", () => {
  it("returns SAPHIRE for 0 sprints", () => {
    expect(calculateMembershipTier(DivisionType.TECHNO, 0)).toBe(MemberTierType.SAPHIRE);
  });

  it("returns EMERALD at Techno threshold 25", () => {
    expect(calculateMembershipTier(DivisionType.TECHNO, 25)).toBe(MemberTierType.EMERALD);
  });

  it("returns RUBY at Techno threshold 50", () => {
    expect(calculateMembershipTier(DivisionType.TECHNO, 50)).toBe(MemberTierType.RUBY);
  });

  it("returns DIAMOND at Techno threshold 75", () => {
    expect(calculateMembershipTier(DivisionType.TECHNO, 75)).toBe(MemberTierType.DIAMOND);
  });
});

// ── INT-SPR22-002: Tier ordering ──────────────────────────────────────────
describe("INT-SPR22-002: getNextTier / getPreviousTier", () => {
  it("TIER_ORDER has 4 entries in correct order", () => {
    expect(TIER_ORDER).toEqual([
      MemberTierType.SAPHIRE,
      MemberTierType.EMERALD,
      MemberTierType.RUBY,
      MemberTierType.DIAMOND,
    ]);
  });

  it("getNextTier: SAPHIRE → EMERALD", () => {
    expect(getNextTier(MemberTierType.SAPHIRE)).toBe(MemberTierType.EMERALD);
  });

  it("getNextTier: DIAMOND → null (max tier)", () => {
    expect(getNextTier(MemberTierType.DIAMOND)).toBeNull();
  });

  it("getPreviousTier: EMERALD → SAPHIRE", () => {
    expect(getPreviousTier(MemberTierType.EMERALD)).toBe(MemberTierType.SAPHIRE);
  });

  it("getPreviousTier: SAPHIRE → null (min tier)", () => {
    expect(getPreviousTier(MemberTierType.SAPHIRE)).toBeNull();
  });
});

// ── INT-SPR22-003: qualifiesForUpgrade ────────────────────────────────────
describe("INT-SPR22-003: qualifiesForUpgrade", () => {
  it("SAPHIRE with 0 tokens — not qualified, needs 430", () => {
    const result = qualifiesForUpgrade(DivisionType.OPCENT, MemberTierType.SAPHIRE, 0);
    expect(result.qualified).toBe(false);
    expect(result.nextTier).toBe(MemberTierType.EMERALD);
    expect(result.pointsNeeded).toBe(430);
  });

  it("SAPHIRE with 430 tokens — qualified for EMERALD", () => {
    const result = qualifiesForUpgrade(DivisionType.OPCENT, MemberTierType.SAPHIRE, 430);
    expect(result.qualified).toBe(true);
    expect(result.pointsNeeded).toBe(0);
  });

  it("DIAMOND tier — no next tier, no points needed", () => {
    const result = qualifiesForUpgrade(DivisionType.OPCENT, MemberTierType.DIAMOND, 9999);
    expect(result.qualified).toBe(false);
    expect(result.nextTier).toBeNull();
    expect(result.pointsNeeded).toBeNull();
  });
});

// ── INT-SPR22-004: isAtRiskOfDowngrade ────────────────────────────────────
describe("INT-SPR22-004: isAtRiskOfDowngrade", () => {
  it("0 inactive months — not at risk", () => {
    expect(isAtRiskOfDowngrade(DivisionType.OPCENT, MemberTierType.EMERALD, 0)).toBe(false);
  });

  it("1 inactive month — not at risk yet", () => {
    expect(isAtRiskOfDowngrade(DivisionType.OPCENT, MemberTierType.EMERALD, 1)).toBe(false);
  });

  it("2+ inactive months AND above SAPHIRE — at risk", () => {
    expect(isAtRiskOfDowngrade(DivisionType.OPCENT, MemberTierType.EMERALD, 2)).toBe(true);
    expect(isAtRiskOfDowngrade(DivisionType.OPCENT, MemberTierType.RUBY,    3)).toBe(true);
  });

  it("SAPHIRE tier — never at risk of downgrade (already minimum)", () => {
    expect(isAtRiskOfDowngrade(DivisionType.OPCENT, MemberTierType.SAPHIRE, 5)).toBe(false);
  });
});

// ── INT-SPR22-005: isValidTierTransition ─────────────────────────────────
describe("INT-SPR22-005: isValidTierTransition", () => {
  it("SAPHIRE → EMERALD up is valid", () => {
    expect(isValidTierTransition(MemberTierType.SAPHIRE, MemberTierType.EMERALD, "up")).toBe(true);
  });

  it("EMERALD → SAPHIRE down is valid", () => {
    expect(isValidTierTransition(MemberTierType.EMERALD, MemberTierType.SAPHIRE, "down")).toBe(true);
  });

  it("EMERALD → SAPHIRE up is invalid", () => {
    expect(isValidTierTransition(MemberTierType.EMERALD, MemberTierType.SAPHIRE, "up")).toBe(false);
  });
});

// ── INT-SPR22-006: getTierDisplayName ────────────────────────────────────
describe("INT-SPR22-006: getTierDisplayName", () => {
  it("returns correct display names", () => {
    expect(getTierDisplayName(MemberTierType.SAPHIRE)).toBe("Saphire");
    expect(getTierDisplayName(MemberTierType.EMERALD)).toBe("Emerald");
    expect(getTierDisplayName(MemberTierType.RUBY)).toBe("Ruby");
    expect(getTierDisplayName(MemberTierType.DIAMOND)).toBe("Diamond");
  });
});
