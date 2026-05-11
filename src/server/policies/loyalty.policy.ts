/**
 * Centralized business logic and policy limits for the Loyalty System.
 */

import { MemberTierTypeEnum } from "@/lib/validations";
import { z } from "zod";

type MemberTierType = z.infer<typeof MemberTierTypeEnum>;

export const LOYALTY_POLICIES = {
  // Minimum tokens required to be eligible for any redemption
  REDEMPTION_THRESHOLD: 2000,

  // Optel token conversion logic based on PRD
  OPTEL_CONVERSION: {
    PER_SLOT_VALUE: 2, // Example: 2 tokens per 1 slot
  },
  
  // Techno token conversion logic based on PRD
  TECHNO_CONVERSION: {
    PER_SPRINT_VALUE: 5, // Example: 5 tokens per 1 sprint completed
  },

  // Member Tiers and their required minimum token thresholds
  TIER_THRESHOLDS: {
    BRONZE: 0,
    SILVER: 100,
    GOLD: 300,
    PLATINUM: 500,
  } as Record<MemberTierType, number>,

  // Validates if a user qualifies for a given tier based on their tokens
  calculateTier(totalTokens: number): MemberTierType {
    if (totalTokens >= this.TIER_THRESHOLDS.PLATINUM) return "PLATINUM";
    if (totalTokens >= this.TIER_THRESHOLDS.GOLD) return "GOLD";
    if (totalTokens >= this.TIER_THRESHOLDS.SILVER) return "SILVER";
    return "BRONZE";
  },

  // Hardcoded Periods based on AGENTS.md Business Logic Guidance
  PERIODS: {
    P1: {
      startMonth: 12, // December 16
      startDay: 16,
      endMonth: 6,    // June 15
      endDay: 15,
    },
    P2: {
      startMonth: 6,  // June 16
      startDay: 16,
      endMonth: 12,   // December 15
      endDay: 15,
    }
  },

  // Determines the active period based on a given date
  determinePeriod(date: Date): "P1" | "P2" {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    if ((month === 12 && day >= 16) || (month >= 1 && month <= 5) || (month === 6 && day <= 15)) {
      return "P1";
    }
    return "P2";
  }
};
