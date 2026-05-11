/**
 * Zod Validation Schemas
 * Shared between frontend forms and backend API routes.
 */

import { z } from "zod";

// ============================================================
// SHARED ENUMS
// ============================================================

export const RoleTypeEnum = z.enum(["MITRA", "TEAM_LEADER", "HC_PM"]);
export const DivisionTypeEnum = z.enum(["OPTEL", "TECHNO"]);
export const PartnershipStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);
export const EmploymentStatusEnum = z.enum(["ACTIVE", "RESIGNED", "TERMINATED"]);
export const MemberTierTypeEnum = z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]);
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
  npk: z.string().min(3, "NPK must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================
// REDEMPTION
// ============================================================

export const redeemRequestSchema = z.object({
  rewardItemId: z.string().min(1, "Reward item ID is required"),
});

export const updateStatusSchema = z.object({
  status: RedemptionStatusEnum,
  reason: z.string().optional(),
});

export type RedeemRequestInput = z.infer<typeof redeemRequestSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ============================================================
// UPLOAD METADATA
// ============================================================

export const uploadMetaSchema = z.object({
  divisionType: DivisionTypeEnum,
  periodId: z.string().optional(), // Can be derived from current date in the service if omitted
  filename: z.string().min(1, "Filename is required"),
});

export type UploadMetaInput = z.infer<typeof uploadMetaSchema>;

// ============================================================
// IMPORT ROW SCHEMAS (RAW PARSER)
// ============================================================

// These schemas represent the expected normalized JSON output from the CSV/XLSX parser.
// The parser maps localized CSV headers (like "Nama", "Total Sprint") to these keys.

export const baseRowSchema = z.object({
  npk: z.string().min(3, "NPK is required"),
  name: z.string().min(1, "Name is required"),
  employmentStatus: z.enum(["AKTIF", "RESIGN", "RESIGNED", "TERMINATED"]).transform(val => {
    if (val === "AKTIF") return "ACTIVE";
    if (val === "RESIGN") return "RESIGNED";
    return val;
  }).pipe(EmploymentStatusEnum),
});

export const optelRowSchema = baseRowSchema.extend({
  slots: z.coerce.number().min(0, "Slots must be non-negative"),
  regularSlots: z.coerce.number().min(0).optional().default(0),
  partnershipStatus: z.enum(["AKTIF", "INAKTIF", "ACTIVE", "INACTIVE"]).transform(val => {
    if (val === "AKTIF") return "ACTIVE";
    if (val === "INAKTIF") return "INACTIVE";
    return val;
  }).pipe(PartnershipStatusEnum).optional().default("ACTIVE"),
});

export const technoRowSchema = baseRowSchema.extend({
  sprintBalance: z.coerce.number().min(0, "Sprint balance must be non-negative"),
  projectRejections: z.coerce.number().min(0).optional().default(0),
});

export type OptelRowInput = z.infer<typeof optelRowSchema>;
export type TechnoRowInput = z.infer<typeof technoRowSchema>;

// ============================================================
// USER
// ============================================================

export const createUserSchema = z.object({
  npk: z.string().min(3),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: RoleTypeEnum.default("MITRA"),
  divisionId: z.string().optional(),
  teamId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
