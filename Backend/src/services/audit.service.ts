/**
 * Backend/src/services/audit.service.ts
 *
 * Audit trail logging — exported as plain functions (not a class).
 * All mutations in the system must call logAudit for traceability.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

export type AuditAction =
  | "UPLOAD_STAGED"
  | "UPLOAD_COMMITTED"
  | "UPLOAD_FAILED"
  | "TOKENS_ISSUED"
  | "REDEMPTION_VERIFIED"
  | "REDEMPTION_REJECTED"
  | "REDEMPTION_CREATED"
  | "REDEMPTION_STATUS_UPDATED"
  | "MANUAL_TOKEN_ADJUSTMENT"
  | "EMPLOYEE_RESIGNED";

interface LogAuditParams {
  action: AuditAction;
  actorId: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string | undefined;
  /** Allows injecting a transaction client for atomic logs */
  tx?: Prisma.TransactionClient;
}

/**
 * Logs an action to the audit trail.
 * Can be used standalone or passed a Prisma Transaction Client (`tx`) to ensure
 * the log is committed atomically with the related business operation.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  const client = params.tx ?? prisma;

  await client.auditLog.create({
    data: {
      action: params.action,
      actorId: params.actorId,
      targetType: params.targetType,
      targetId: params.targetId,
      details: (params.details ?? {}) as Prisma.InputJsonValue,
      ipAddress: params.ipAddress ?? null,
    },
  });
}

/**
 * @deprecated Use logAudit() directly. This class wrapper is kept for backward compatibility.
 */
export const AuditService = {
  log: logAudit,
};
