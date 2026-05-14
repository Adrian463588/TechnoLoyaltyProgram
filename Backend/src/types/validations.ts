/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * Zod Validation Schemas
 * Shared between frontend forms and backend API routes.
 */

import { z } from "zod";

// ============================================================
// SHARED ENUMS
// ============================================================

export const UserRoleEnum = z.enum(["MITRA", "TEAM_LEAD", "HC_ADMIN"]);
export const DivisionEnum = z.enum(["OPCENT", "TELE", "TECHNO"]);
export const PartnerStatusEnum = z.enum(["ACTIVE", "INACTIVE", "RESIGNED"]);
export const MembershipTierEnum = z.enum(["SAPHIRE", "EMERALD", "RUBY", "DIAMOND"]);
export const HealthBenefitEnum = z.enum(["NONE", "FIT", "CLASSY"]);
export const TokenEventTypeEnum = z.enum([
  "EARNED_SHIFT",
  "EARNED_PROJECT",
  "REDEEMED",
  "EXPIRED",
  "MANUAL_ADJUSTMENT",
  "DOWNGRADE_PENALTY",
  "RESET_PENALTY",
]);
export const ClaimStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const UploadStatusEnum = z.enum(["STAGED", "VALIDATING", "PROCESSING", "COMPLETED", "FAILED"]);
export const RedemptionStatusEnum = z.enum([
  "DRAFT",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "PURCHASED",
  "PICKUP_SCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);

// ============================================================
// AUTH
// ============================================================

export const loginSchema = z.object({
  email: z.string().email("Invalid company email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================
// REDEMPTION
// ============================================================

export const redeemRequestSchema = z.object({
  rewardItemId: z.string().uuid("Invalid reward item ID"),
});

export const updateStatusSchema = z.object({
  status: RedemptionStatusEnum,
  reason: z.string().optional(),
});

export const redemptionVerificationSchema = z.object({
  idCardVerified: z.boolean(),
  ktpVerified: z.boolean(),
  npwpVerified: z.boolean(),
  powerOfAttorneyVerified: z.boolean().optional(),
});

export type RedeemRequestInput = z.infer<typeof redeemRequestSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type RedemptionVerificationInput = z.infer<typeof redemptionVerificationSchema>;

// ============================================================
// TOKEN ADJUSTMENT (HC ADMIN)
// ============================================================

export const tokenAdjustmentSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  reason: z.string().min(10, "Reason must be at least 10 characters for audit purposes"),
});

export type TokenAdjustmentInput = z.infer<typeof tokenAdjustmentSchema>;

// ============================================================
// UPLOAD METADATA
// ============================================================

export const uploadMetaSchema = z.object({
  division: DivisionEnum,
  filename: z.string().min(1, "Filename is required"),
});

export type UploadMetaInput = z.infer<typeof uploadMetaSchema>;

// ============================================================
// IMPORT ROW SCHEMAS (RAW PARSER)
// ============================================================

export const baseRowSchema = z.object({
  email: z.string().email("Email is required"),
  name: z.string().min(1, "Name is required"),
  partnerStatus: z.enum(["AKTIF", "RESIGN", "RESIGNED", "INAKTIF"]).transform(val => {
    if (val === "AKTIF") return "ACTIVE";
    if (val === "RESIGN") return "RESIGNED";
    if (val === "INAKTIF") return "INACTIVE";
    return val;
  }).pipe(PartnerStatusEnum),
});

export const opcentTeleRowSchema = baseRowSchema.extend({
  slots: z.coerce.number().min(0, "Slots must be non-negative"),
});

export const technoRowSchema = baseRowSchema.extend({
  completedProjects: z.coerce.number().min(0, "Projects must be non-negative"),
  projectRejections: z.coerce.number().min(0).optional().default(0),
});

export type OpcentTeleRowInput = z.infer<typeof opcentTeleRowSchema>;
export type TechnoRowInput = z.infer<typeof technoRowSchema>;

// ============================================================
// USER
// ============================================================

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  division: DivisionEnum,
  role: UserRoleEnum.default("MITRA"),
  teamLeadId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ============================================================
// COMMON VALIDATION SCHEMAS
// ============================================================

export const uuidSchema = z.string().uuid("Invalid UUID format");

export type UuidInput = z.infer<typeof uuidSchema>;
