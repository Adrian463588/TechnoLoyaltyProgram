/**
 * Backend/src/domain/token-engine/techno/engine.ts
 *
 * Token calculation engine for Techno Center division.
 * 
 * Business Rules (PRD Section 6.4):
 * - Project-based evaluation every 6 months
 * - Tier thresholds: Saphire=0, Emerald=25, Ruby=50, Diamond=75
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
// TECHNO SPECIFIC CONFIGURATION
// ============================================================

const TECHNO_THRESHOLDS: Record<MemberTierType, number> = {
  [MemberTierType.SAPHIRE]: 0,
  [MemberTierType.EMERALD]: 25,
  [MemberTierType.RUBY]: 50,
  [MemberTierType.DIAMOND]: 75,
};

const TECHNO_HEALTH_BENEFITS: Record<MemberTierType, HealthBenefit> = {
  [MemberTierType.SAPHIRE]: HealthBenefit.NONE,
  [MemberTierType.EMERALD]: HealthBenefit.FIT,
  [MemberTierType.RUBY]: HealthBenefit.FIT,
  [MemberTierType.DIAMOND]: HealthBenefit.CLASSY,
};

// ============================================================
// TIER CALCULATION
// ============================================================

/**
 * Determines membership tier based on cumulative projects.
 * Boundary: exactly 25 projects = Emerald, 24 = Saphire
 */
export function calculateTechnoTier(cumulativeProjects: number): MemberTierType {
  if (cumulativeProjects >= TECHNO_THRESHOLDS[MemberTierType.DIAMOND]) {
    return MemberTierType.DIAMOND;
  }
  if (cumulativeProjects >= TECHNO_THRESHOLDS[MemberTierType.RUBY]) {
    return MemberTierType.RUBY;
  }
  if (cumulativeProjects >= TECHNO_THRESHOLDS[MemberTierType.EMERALD]) {
    return MemberTierType.EMERALD;
  }
  return MemberTierType.SAPHIRE;
}

// ============================================================
// PERIOD CALCULATION
// ============================================================

/**
 * Gets the current 6-month evaluation period for Techno.
 * P1: Dec 16 (Year-1) → Jun 15 (Year)
 * P2: Jun 16 (Year) → Dec 15 (Year)
 */
export function getTechnoPeriodDates(referenceDate: Date = new Date()): {
  period: "P1" | "P2";
  start: Date;
  end: Date;
  daysRemaining: number;
  monthsRemaining: number;
} {
  const year = referenceDate.getFullYear();
  const now = referenceDate.getTime();
  
  // P1: Dec 16 previous year to Jun 15 current year
  const p1Start = new Date(year - 1, 11, 16, 0, 0, 0); // Dec 16
  const p1End = new Date(year, 5, 15, 23, 59, 59); // Jun 15
  
  // P2: Jun 16 to Dec 15
  const p2Start = new Date(year, 5, 16, 0, 0, 0); // Jun 16
  const p2End = new Date(year, 11, 15, 23, 59, 59); // Dec 15
  
  // Check if we're in P1 (Dec 16 previous year to Jun 15 current year)
  if (now >= p1Start.getTime() && now <= p1End.getTime()) {
    const daysRemaining = Math.ceil((p1End.getTime() - now) / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.ceil(daysRemaining / 30);
    return { period: "P1", start: p1Start, end: p1End, daysRemaining, monthsRemaining };
  }
  
  // Check if we're in P2 (Jun 16 to Dec 15)
  if (now >= p2Start.getTime() && now <= p2End.getTime()) {
    const daysRemaining = Math.ceil((p2End.getTime() - now) / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.ceil(daysRemaining / 30);
    return { period: "P2", start: p2Start, end: p2End, daysRemaining, monthsRemaining };
  }
  
  // After Dec 15 but before Dec 16 (gap between periods)
  if (now > p2End.getTime() && now < p1Start.getTime() + 365 * 24 * 60 * 60 * 1000) {
    const nextP1Start = new Date(year, 11, 16, 0, 0, 0); // Dec 16 current year
    const nextP1End = new Date(year + 1, 5, 15, 23, 59, 59); // Jun 15 next year
    const daysRemaining = Math.ceil((nextP1End.getTime() - now) / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.ceil(daysRemaining / 30);
    return { period: "P1", start: nextP1Start, end: nextP1End, daysRemaining, monthsRemaining };
  }
  
  // Default fallback
  const nextP2Start = new Date(year, 5, 16, 0, 0, 0);
  const nextP2End = new Date(year, 11, 15, 23, 59, 59);
  const daysRemaining = Math.ceil((nextP2End.getTime() - now) / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.ceil(daysRemaining / 30);
  
  return { period: "P2", start: nextP2Start, end: nextP2End, daysRemaining, monthsRemaining };
}

/**
 * Checks if the current date is within the evaluation period.
 * Evaluation deadline: June 15 or December 15 depending on period
 */
export function isWithinTechnoEvaluationPeriod(referenceDate: Date = new Date()): boolean {
  const { end } = getTechnoPeriodDates(referenceDate);
  return referenceDate <= end;
}

/**
 * Gets the evaluation deadline for the current period.
 */
export function getTechnoEvaluationDeadline(referenceDate: Date = new Date()): Date {
  const { end } = getTechnoPeriodDates(referenceDate);
  return end;
}

// ============================================================
// MAIN ENGINE CLASS
// ============================================================

export class TechnoTokenEngine {
  readonly division = DivisionType.TECHNO;
  
  /**
   * Calculates tokens, tier, and benefits based on cumulative projects.
   */
  calculate(cumulativeProjects: number, referenceDate: Date = new Date()): TokenEngineResult {
    const tier = calculateTechnoTier(cumulativeProjects);
    const healthBenefit = getHealthBenefitForTier(tier, TECHNO_HEALTH_BENEFITS);
    const pointsToNext = calculatePointsToNextTier(
      cumulativeProjects,
      tier,
      TECHNO_THRESHOLDS,
      TIER_ORDER
    );
    const isWithinPeriod = isWithinTechnoEvaluationPeriod(referenceDate);
    const evaluationDeadline = getTechnoEvaluationDeadline(referenceDate);
    
    return {
      tokens: cumulativeProjects,
      tier,
      healthBenefit,
      pointsToNextTier: pointsToNext,
      nextTier: pointsToNext !== null ? calculateTechnoTier(cumulativeProjects + pointsToNext) : null,
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
      evaluationDeadline: getTechnoEvaluationDeadline(),
      tierThresholds: TECHNO_THRESHOLDS,
      healthBenefits: TECHNO_HEALTH_BENEFITS,
    };
  }
  
  /**
   * Validates if a project count is valid.
   */
  validateProjectCount(projects: number): { valid: boolean; error?: string } {
    if (projects < 0) {
      return { valid: false, error: "Project count cannot be negative" };
    }
    if (!Number.isInteger(projects)) {
      return { valid: false, error: "Project count must be a whole number" };
    }
    return { valid: true };
  }
  
  /**
   * Calculates tokens for a completed project.
   */
  calculateProjectTokens(projectCount: number): number {
    const validation = this.validateProjectCount(projectCount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    // 1 Project = 1 Token
    return projectCount;
  }
}

// Export singleton instance
export const technoTokenEngine = new TechnoTokenEngine();