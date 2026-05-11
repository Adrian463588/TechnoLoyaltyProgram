import { prisma } from "@/lib/db/prisma";

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
  details?: Record<string, any>;
  ipAddress?: string;
  // Allows injecting a transaction client for atomic logs
  tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
}

export class AuditService {
  /**
   * Logs an action to the audit trail.
   * Can be used standalone or passed a Prisma Transaction Client (`tx`) to ensure
   * the log is committed atomically with the related business operation.
   */
  static async log(params: LogAuditParams) {
    const client = params.tx ?? prisma;
    
    await client.auditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details ?? {},
        ipAddress: params.ipAddress,
      },
    });
  }
}
