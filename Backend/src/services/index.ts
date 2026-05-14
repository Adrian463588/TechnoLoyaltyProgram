/**
 * Backend/src/services/index.ts
 * Barrel export — all backend domain services.
 *
 * DRY: consumers import from here, not from individual files.
 */

export { logAudit }                                 from "./audit.service";
export type { AuditAction }                         from "./audit.service";

export { LoyaltyCalculationService }                from "./loyalty-calculation.service";

export {
  determineTier,
  getNextTier,
  getPointsToNextTier,
  calculateOptelTokens,
  calculateTechnoTokens,
  checkDowngrade,
  checkReset,
  checkRedemptionEligibility,
  TIER_THRESHOLDS,
  TIER_ORDER,
  REDEMPTION_ELIGIBILITY_THRESHOLD,
} from "./loyalty.service";

export { PeriodService }                            from "./period.service";
export { RedemptionService }                        from "./redemption.service";

export {
  parseOptelCSV,
  parseTechnoCSV,
  buildUploadSummary,
  UploadProcessingService,
}                                                   from "./upload.service";

export {
  parseOptelXLSX,
  parseTechnoXLSX,
  detectDivisionFromXLSX,
}                                                   from "./upload-xlsx.service";
