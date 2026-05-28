/**
 * Backend/src/services/partner-status-confirmation.service.ts
 *
 * PRD HC-06 / TL-01:
 *   HC requests partner (Mitra) active/resigned status confirmation from TL.
 *   TL confirms → status is recorded → HC processes redemption.
 *
 * SOLID — SRP: handles only partner status confirmation lifecycle.
 * AGENTS.md: Audit required for all status changes.
 */

import { prisma } from "@/db/prisma";
import { logAudit } from "./audit.service";
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from "@/errors/index";

type ConfirmationStatus =
  | "PENDING"
  | "CONFIRMED_ACTIVE"
  | "CONFIRMED_RESIGNED"
  | "CANCELLED";

export class PartnerStatusConfirmationService {
  /**
   * HC requests TL to confirm active/resigned status for a Mitra
   * before processing their redemption.
   *
   * PRD HC-06
   */
  async requestConfirmation(
    redemptionRequestId: string,
    mitraId:             string,
    teamLeadId:          string,
    requestedBy:         string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    // Verify redemption exists
    const redemption = await prisma.redemptionRequest.findUnique({
      where: { id: redemptionRequestId },
    });
    if (!redemption) throw new NotFoundError("RedemptionRequest", redemptionRequestId);

    // Verify TL exists and has the right role
    const tl = await prisma.user.findUnique({ where: { id: teamLeadId } });
    if (!tl || tl.role !== "TEAM_LEADER") {
      throw new ValidationError("Assigned user is not a Team Leader.");
    }

    // Prevent duplicate active requests
    const existing = await prisma.partnerStatusConfirmation.findFirst({
      where: {
        redemptionRequestId,
        mitraId,
        status: "PENDING",
      },
    });
    if (existing) {
      throw new ConflictError(
        "CONFIRMATION_ALREADY_PENDING",
        "A pending confirmation request already exists for this redemption.",
      );
    }

    const confirmation = await prisma.partnerStatusConfirmation.create({
      data: {
        redemptionRequestId,
        mitraId,
        requestedBy,
        assignedTo: teamLeadId,
        status: "PENDING",
      },
    });

    await logAudit({
      action:    "PARTNER_STATUS_CONFIRMATION_REQUESTED",
      actorId:   requestedBy,
      targetType: "PartnerStatusConfirmation",
      targetId:  confirmation.id,
      newValue:  { redemptionRequestId, mitraId, assignedTo: teamLeadId },
    });

    return confirmation;
  }

  /**
   * Team Leader confirms or denies the active/resigned status.
   *
   * PRD TL-01
   */
  async confirm(
    confirmationId: string,
    status: "CONFIRMED_ACTIVE" | "CONFIRMED_RESIGNED",
    actorId: string,
    note?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const confirmation = await prisma.partnerStatusConfirmation.findUnique({
      where: { id: confirmationId },
    });

    if (!confirmation) throw new NotFoundError("PartnerStatusConfirmation", confirmationId);

    // Only the assigned TL can confirm
    if (confirmation.assignedTo !== actorId) {
      throw new ForbiddenError("Only the assigned Team Leader can confirm this request.");
    }

    if (confirmation.status !== "PENDING") {
      throw new ValidationError(`Confirmation is already ${confirmation.status}.`);
    }

    const updated = await prisma.partnerStatusConfirmation.update({
      where: { id: confirmationId },
      data: {
        status,
        note:        note ?? null,
        confirmedAt: new Date(),
      },
    });

    await logAudit({
      action:        "PARTNER_STATUS_CONFIRMED",
      actorId,
      targetType:    "PartnerStatusConfirmation",
      targetId:      confirmationId,
      previousValue: { status: "PENDING" },
      newValue:      { status, note: note ?? null },
    });

    return updated;
  }

  /** HC or TL cancels a pending request. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async cancel(confirmationId: string, actorId: string): Promise<any> {
    const confirmation = await prisma.partnerStatusConfirmation.findUnique({
      where: { id: confirmationId },
    });

    if (!confirmation) throw new NotFoundError("PartnerStatusConfirmation", confirmationId);

    if (confirmation.status !== "PENDING") {
      throw new ValidationError(`Cannot cancel — status is already ${confirmation.status}.`);
    }

    const updated = await prisma.partnerStatusConfirmation.update({
      where: { id: confirmationId },
      data:  { status: "CANCELLED" },
    });

    await logAudit({
      // BUG-003 FIX: was incorrectly logging as "PARTNER_STATUS_CONFIRMED"
      action:        "PARTNER_STATUS_CANCELLED",
      actorId,
      targetType:    "PartnerStatusConfirmation",
      targetId:      confirmationId,
      previousValue: { status: "PENDING" },
      newValue:      { status: "CANCELLED" },
    });

    return updated;
  }

  /** List confirmations assigned to the current TL. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async listForTL(teamLeadId: string, statusFilter?: ConfirmationStatus): Promise<any[]> {
    return prisma.partnerStatusConfirmation.findMany({
      where: {
        assignedTo: teamLeadId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        mitra:             { select: { id: true, name: true, npk: true, division: true } },
        redemptionRequest: { select: { id: true, status: true, tokenCost: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** List confirmations created by HC. */
  async listForHC(requestedBy: string, params: { status?: ConfirmationStatus; limit?: number; offset?: number } = {}): Promise<{ items: any[]; total: number }> {
    const { status, limit = 100, offset = 0 } = params;
    const where = {
      requestedBy,
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.partnerStatusConfirmation.findMany({
        where,
        include: {
          mitra:    { select: { id: true, name: true, npk: true, division: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.partnerStatusConfirmation.count({ where })
    ]);

    return { items, total };
  }
}

export const partnerStatusConfirmationService = new PartnerStatusConfirmationService();
