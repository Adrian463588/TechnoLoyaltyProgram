/**
 * Backend/src/policies/loyalty.policy.ts
 *
 * Centralized loyalty business rules and calculation policies.
 * SOLID — OCP: new policies can be added without changing service code.
 * DRY: single source of truth for all tier/token constants.
 */

import { MemberTierType } from "@prisma/client";

// ── Tier thresholds (Annual for OPCENT/TELE, 6-monthly for TECHNO) ──────────
const OPCENT_TELE_THRESHOLDS = {
  SAPHIRE: 0,
  EMERALD: 430,
  RUBY:    860,
  DIAMOND: 1300,
} as const;

const TECHNO_THRESHOLDS = {
  SAPHIRE: 0,
  EMERALD: 25,
  RUBY:    50,
  DIAMOND: 75,
} as const;

const TIER_ORDER: MemberTierType[] = [
  MemberTierType.SAPHIRE,
  MemberTierType.EMERALD,
  MemberTierType.RUBY,
  MemberTierType.DIAMOND,
];

// ── Period Constants ────────────────────────────────────────────────────────
// P1: Dec 16 to June 15
// P2: June 16 to Dec 15
const PERIODS = {
  P1_START: { month: 11, day: 16 }, // Dec 16 (0-indexed month: 11)
  P1_END:   { month: 5,  day: 15 }, // June 15 (0-indexed month: 5)
  P2_START: { month: 5,  day: 16 }, // June 16
  P2_END:   { month: 11, day: 15 }, // Dec 15
} as const;

// ── Token conversion rates ─────────────────────────────────────────────────
const CONVERSION = {
  OPCENT_TELE_SLOT: 1, // 1 Slot = 1 Token
  TECHNO_PROJECT:   1, // Assuming 1 Project = 1 Token
} as const;

// ── Tier calculation helpers ────────────────────────────────────────────────
function calculateOpcentTeleTier(cumulativeSlots: number): MemberTierType {
  if (cumulativeSlots >= OPCENT_TELE_THRESHOLDS.DIAMOND) return MemberTierType.DIAMOND;
  if (cumulativeSlots >= OPCENT_TELE_THRESHOLDS.RUBY)    return MemberTierType.RUBY;
  if (cumulativeSlots >= OPCENT_TELE_THRESHOLDS.EMERALD) return MemberTierType.EMERALD;
  return MemberTierType.SAPHIRE;
}

function calculateTechnoTier(cumulativeProjects: number): MemberTierType {
  if (cumulativeProjects >= TECHNO_THRESHOLDS.DIAMOND) return MemberTierType.DIAMOND;
  if (cumulativeProjects >= TECHNO_THRESHOLDS.RUBY)    return MemberTierType.RUBY;
  if (cumulativeProjects >= TECHNO_THRESHOLDS.EMERALD) return MemberTierType.EMERALD;
  return MemberTierType.SAPHIRE;
}

// ── Public policy object ───────────────────────────────────────────────────
export const LOYALTY_POLICIES = {
  OPCENT_TELE_THRESHOLDS,
  TECHNO_THRESHOLDS,
  TIER_ORDER,
  CONVERSION,
  PERIODS,
  calculateOpcentTeleTier,
  calculateTechnoTier,
} as const;
