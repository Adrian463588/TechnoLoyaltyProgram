/**
 * Backend/src/policies/loyalty.policy.ts
 *
 * Centralized loyalty business rules and calculation policies.
 * SOLID — OCP: new policies can be added without changing service code.
 * DRY: single source of truth for all tier/token constants.
 */

import type { MemberTierType } from "@prisma/client";

type TierStatus = MemberTierType;

// ── Tier thresholds ────────────────────────────────────────────────────────
const TIER_THRESHOLDS: Record<TierStatus, number> = {
  BRONZE:   0,
  SILVER:   1_000,
  GOLD:     3_000,
  PLATINUM: 6_000,
};

const TIER_ORDER: TierStatus[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

// ── Token conversion rates ─────────────────────────────────────────────────
const OPTEL_CONVERSION = {
  PER_SLOT_VALUE: 100,   // tokens per slot
} as const;

const TECHNO_CONVERSION = {
  PER_SPRINT_VALUE: 200, // tokens per sprint
} as const;

// ── Redemption threshold ────────────────────────────────────────────────────
const REDEMPTION_THRESHOLD = 2_000;

// ── Tier calculation helper ─────────────────────────────────────────────────
function calculateTier(totalTokens: number): TierStatus {
  if (totalTokens >= TIER_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (totalTokens >= TIER_THRESHOLDS.GOLD)     return "GOLD";
  if (totalTokens >= TIER_THRESHOLDS.SILVER)   return "SILVER";
  return "BRONZE";
}

// ── Public policy object ───────────────────────────────────────────────────
export const LOYALTY_POLICIES = {
  TIER_THRESHOLDS,
  TIER_ORDER,
  OPTEL_CONVERSION,
  TECHNO_CONVERSION,
  REDEMPTION_THRESHOLD,
  calculateTier,
} as const;
