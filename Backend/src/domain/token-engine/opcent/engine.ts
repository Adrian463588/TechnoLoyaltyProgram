/**
 * Backend/src/domain/token-engine/opcent/engine.ts
 *
 * Token calculation engine for Opcent & Tele divisions.
 * 
 * Business Rules (PRD Section 6.1 & 6.2):
 * - 1 Slot = 1 Token
 * - Annual evaluation by December 15
 * - Tier thresholds: Saphire=0, Emerald=430, Ruby=860, Diamond=1,300
 * - Health benefits: Emerald/Ruby=FIT, Diamond=CLASSY
 */

import { MemberTierType, HealthBenefit, DivisionType } from "@prisma/client";
import { 
  TokenEngineResult, 
  TokenEngineConfig,
  TIER_ORDER,
  calculatePointsToNextTier,
  getHealthBenefitForTier,
  endOfDay 
} from "../base";

// ============================================================
// OPCENT/TELE SPECIFIC CONFIGURATION
// ============================================================

const OPCENT_TELE_THRESHOLDS: Record<MemberTierType, number> = {
  [MemberTierType.SAPHIRE]: 0,
  [MemberTierType.EMERALD]: 430,
  [MemberTierType.RUBY]: 860,
  [MemberTierType.DIAMOND]: 1300,
};

const OPCENT_TELE_HEALTH_BENEFITS: Record<MemberTierType, HealthBenefit> = {
  [MemberTierType.SAPHIRE]: HealthBenefit.NONE,
  [MemberTierType.EMERALD]: HealthBenefit.FIT,
  [MemberTierType.RUBY]: HealthBenefit.FIT,
  [MemberTierType.DIAMOND]: HealthBenefit.CLASSY,
};

// ============================================================
// TIER CALCULATION
// ============================================================

/**
 * Determines membership tier based on cumulative slots.
 * Boundary: exactly 430 slots = Emerald, 429 = Saphire
 */
export function calculateOpcentTier(cumulativeSlots: number): MemberTierType {
  if (cumulativeSlots >= OPCENT_TELE_THRESHOLDS[MemberTierType.DIAMOND]) {
    return MemberTierType.DIAMOND;
  }
  if (cumulativeSlots >= OPCENT_TELE_THRESHOLDS[MemberTierType.RUBY]) {
    return MemberTierType.RUBY;
  }
  if (cumulativeSlots >= OPCENT_TELE_THRESHOLDS[MemberTierType.EMERALD]) {
    return MemberTierType.EMERALD;
  }
  return MemberTierType.SAPHIRE;
}

// ============================================================
// PERIOD CALCULATION
// ============================================================

/**
 * Gets the current evaluation period for Opcent/Tele.
 * P1: Dec 16 (Year-1) → Jun 15 (Year)
 * P2: Jun 16 (Year) → Dec 15 (Year)
 */
export function getOpcentPeriodDates(referenceDate: Date = new Date()): {
  period: "P1" | "P2";
  start: Date;
  end: Date;
  daysRemaining: number;
} {
  const year = referenceDate.getFullYear();
  const now = referenceDate.getTime();
  
  // P1: Dec 16 previous year to Jun 15 current year
  const p1Start = new Date(year - 1, 11, 16, 0, 0, 0); // Dec 16 previous year
  const p1End = new Date(year, 5, 15, 23, 59, 59); // Jun 15 current year
  
  // P2: Jun 16 to Dec 15 current year
  const p2Start = new Date(year, 5, 16, 0, 0, 0); // Jun 16
  const p2End = new Date(year, 11, 15, 23, 59, 59); // Dec 15
  
  // Check if we're in P1 (Dec 16 previous year to Jun 15 current year)
  if (now >= p1Start.getTime() && now <= p1End.getTime()) {
    const daysRemaining = Math.ceil((p1End.getTime() - now) / (1000 * 60 * 60 * 24));
    return { period: "P1", start: p1Start, end: p1End, daysRemaining };
  }
  
  // Check if we're in P2 (Jun 16 to Dec 15)
  if (now >= p2Start.getTime() && now <= p2End.getTime()) {
    const daysRemaining = Math.ceil((p2End.getTime() - now) / (1000 * 60 * 60 * 24));
    return { period: "P2", start: p2Start, end: p2End, daysRemaining };
  }
  
  // After Dec 15 (Dec 16 - Dec 31): This is the START of P1 for the NEXT cycle
  // P1 runs from Dec 16 Year-1 to Jun 15 Year
  // So Dec 16, 2025 starts P1 that runs until Jun 15, 2026
  if (now > p2End.getTime()) {
    const currentP1Start = new Date(year, 11, 16, 0, 0, 0); // Dec 16 current year
    const currentP1End = new Date(year + 1, 5, 15, 23, 59, 59); // Jun 15 next year
    const daysRemaining = Math.ceil((currentP1End.getTime() - now) / (1000 * 60 * 60 * 24));
    return { period: "P1", start: currentP1Start, end: currentP1End, daysRemaining };
  }
  
  // Before Dec 16 of previous year (Jan 1 - Dec 15): This is P2 of PREVIOUS cycle
  // P2 runs from Jun 16 to Dec 15
  // So Jan 1, 2025 is still in P2 (Jun 16, 2024 - Dec 15, 2025)
  const previousP2Start = new Date(year - 1, 5, 16, 0, 0, 0); // Jun 16 previous year
  const previousP2End = new Date(year - 1, 11, 15, 23, 59, 59); // Dec 15 previous year
  const daysRemaining = Math.ceil((previousP2End.getTime() - now) / (1000 * 60 * 60 * 24));
  return { period: "P2", start: previousP2Start, end: previousP2End, daysRemaining };
}

/**
 * Checks if the current date is within an active evaluation period.
 * Returns false after Dec 15 (evaluation deadline), even though
 * Dec 16-31 technically starts P1 of the next cycle.
 */
export function isWithinOpcentEvaluationPeriod(referenceDate: Date = new Date()): boolean {
  const month = referenceDate.getMonth(); // 0-indexed
  const day = referenceDate.getDate();

  // Dec 16-31 is after the Dec 15 deadline — not within evaluation period
  if (month === 11 && day > 15) return false;

  // P1: Jan 1 - Jun 15
  if (month < 5) return true;
  if (month === 5 && day <= 15) return true;

  // P2: Jun 16 - Dec 15
  if (month > 5 && month < 11) return true;
  if (month === 11 && day <= 15) return true;

  return false;
}

/**
 * Gets the evaluation deadline (December 15 of current year).
 */
export function getOpcentEvaluationDeadline(referenceDate: Date = new Date()): Date {
  const year = referenceDate.getFullYear();
  return endOfDay(new Date(year, 11, 15)); // Dec 15
}

// ============================================================
// MAIN ENGINE CLASS
// ============================================================

export class OpcentTokenEngine {
  readonly division = DivisionType.OPCENT;
  
  /**
   * Calculates tokens, tier, and benefits based on cumulative slots.
   */
  calculate(cumulativeSlots: number, referenceDate: Date = new Date()): TokenEngineResult {
    const tier = calculateOpcentTier(cumulativeSlots);
    const healthBenefit = getHealthBenefitForTier(tier, OPCENT_TELE_HEALTH_BENEFITS);
    const pointsToNext = calculatePointsToNextTier(
      cumulativeSlots,
      tier,
      OPCENT_TELE_THRESHOLDS,
      TIER_ORDER
    );
    const isWithinPeriod = isWithinOpcentEvaluationPeriod(referenceDate);
    const evaluationDeadline = getOpcentEvaluationDeadline(referenceDate);
    
    return {
      tokens: cumulativeSlots,
      tier,
      healthBenefit,
      pointsToNextTier: pointsToNext,
      nextTier: pointsToNext !== null ? calculateOpcentTier(cumulativeSlots + pointsToNext) : null,
      isWithinEvaluationPeriod: isWithinPeriod,
      evaluationDeadline,
    };
  }
  
  /**
   * Gets the configuration for this engine.
   */
  getConfig(): TokenEngineConfig {
    return {
      division: this.division,
      evaluationDeadline: getOpcentEvaluationDeadline(),
      tierThresholds: OPCENT_TELE_THRESHOLDS,
      healthBenefits: OPCENT_TELE_HEALTH_BENEFITS,
    };
  }
  
  /**
   * Validates if a slot count is valid.
   */
  validateSlotCount(slots: number): { valid: boolean; error?: string } {
    if (slots < 0) {
      return { valid: false, error: "Slot count cannot be negative" };
    }
    if (!Number.isInteger(slots)) {
      return { valid: false, error: "Slot count must be a whole number" };
    }
    return { valid: true };
  }
  
  /**
   * Calculates tokens for a single shift.
   */
  calculateShiftTokens(slotCount: number): number {
    const validation = this.validateSlotCount(slotCount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    // 1 Slot = 1 Token
    return slotCount;
  }
}

// Export singleton instance
export const opcentTokenEngine = new OpcentTokenEngine();
