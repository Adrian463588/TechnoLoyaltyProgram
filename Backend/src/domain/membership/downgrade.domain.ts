/**
 * Backend/src/domain/membership/downgrade.domain.ts
 *
 * Pure domain rules for membership downgrade and reset.
 * No database connections or HTTP logic here.
 */

import { MemberTierType, DivisionType } from "@prisma/client";
import { LOYALTY_POLICIES } from "../../policies/loyalty.policy";

export type DowngradeTrigger =
  | "no_slots_3_consecutive_months_inactive"
  | "rejected_3_projects_within_6_month_window";

export type ResetTrigger =
  | "no_slots_3_consecutive_months_fully_unavailable"
  | "rejected_3_projects_within_6_month_window";

export interface DowngradeResult {
  newTier: MemberTierType | "PENDING_STAKEHOLDER_CONFIRMATION";
  penaltyAmount: number | "PENDING_STAKEHOLDER_CONFIRMATION";
}

export function calculateDowngrade(
  division: DivisionType,
  currentTier: MemberTierType,
  currentBalance: number,
  trigger: DowngradeTrigger
): DowngradeResult {
  if (division === DivisionType.TECHNO) {
    return {
      newTier: "PENDING_STAKEHOLDER_CONFIRMATION",
      penaltyAmount: "PENDING_STAKEHOLDER_CONFIRMATION",
    };
  }

  // Opcent / Tele Downgrade
  if (trigger === "no_slots_3_consecutive_months_inactive") {
    const penaltyAmount = Math.floor(currentBalance * 0.50);
    const newTier = getOneLevelDown(currentTier);
    return {
      newTier,
      penaltyAmount,
    };
  }

  throw new Error(`Invalid downgrade trigger ${trigger} for division ${division}`);
}

export function calculateReset(
  division: DivisionType,
  currentTier: MemberTierType,
  currentBalance: number,
  trigger: ResetTrigger
): DowngradeResult {
  if (division === DivisionType.TECHNO) {
    // According to PRD, Techno uses same trigger "rejected_3_projects_within_6_month_window" for both
    return {
      newTier: "PENDING_STAKEHOLDER_CONFIRMATION",
      penaltyAmount: "PENDING_STAKEHOLDER_CONFIRMATION",
    };
  }

  if (trigger !== "no_slots_3_consecutive_months_fully_unavailable") {
    throw new Error(`Invalid reset trigger ${trigger} for division ${division}`);
  }

  const penaltyAmount = currentBalance;
  const newTier = MemberTierType.SAPHIRE;
  return {
    newTier,
    penaltyAmount,
  };
}

function getOneLevelDown(tier: MemberTierType): MemberTierType {
  const { TIER_ORDER } = LOYALTY_POLICIES;
  const idx = TIER_ORDER.indexOf(tier);
  if (idx <= 0) return TIER_ORDER[0] as MemberTierType; // SAPHIRE
  return TIER_ORDER[idx - 1] as MemberTierType;
}
