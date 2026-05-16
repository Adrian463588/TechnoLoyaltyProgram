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
  checkRedemptionEligibility,
} from "./loyalty.service";

export { membershipService }                        from "./membership.service";
export { evaluationService }                        from "./evaluation.service";

export { redemptionService }                        from "./redemption.service";
export { tokenLedgerService }                       from "./token-ledger.service";
export { CacheService }                             from "./cache.service";
