/**
 * Backend/src/controllers/partner-status-confirmation.controller.ts
 *
 * HTTP handlers for PRD HC-06 / TL-01 partner status confirmation.
 * Thin layer — delegates all logic to PartnerStatusConfirmationService.
 *
 * SOLID — SRP: HTTP parsing and response only.
 */

import type { RequestHandler } from "express";
import { z } from "zod";
import { partnerStatusConfirmationService } from "@/services/partner-status-confirmation.service";
import { uuidSchema } from "@/types/validations";
import { ValidationError } from "@/errors/index";

// ── Schemas ───────────────────────────────────────────────────────────────────

const requestConfirmationSchema = z.object({
  redemptionRequestId: z.string().uuid(),
  mitraId:             z.string().uuid(),
  teamLeadId:          z.string().uuid(),
});

const confirmSchema = z.object({
  status: z.enum(["CONFIRMED_ACTIVE", "CONFIRMED_RESIGNED"]),
  note:   z.string().max(500).optional(),
});

const listStatusSchema = z
  .enum(["PENDING", "CONFIRMED_ACTIVE", "CONFIRMED_RESIGNED", "CANCELLED"])
  .optional();

// ── Controller ────────────────────────────────────────────────────────────────

export const PartnerStatusConfirmationController = {

  /**
   * POST /api/admin/partner-confirmations
   * HC creates a confirmation request for a TL.
   */
  requestConfirmation: (async (req, res, next) => {
    try {
      const { user } = req;
      const parsed = requestConfirmationSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid input", parsed.error.format());

      const result = await partnerStatusConfirmationService.requestConfirmation(
        parsed.data.redemptionRequestId,
        parsed.data.mitraId,
        parsed.data.teamLeadId,
        user.id,
      );

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /**
   * GET /api/admin/partner-confirmations
   * HC views their own confirmation requests.
   */
  listForHC: (async (req, res, next) => {
    try {
      const { user } = req;
      const statusResult = listStatusSchema.safeParse(req.query["status"]);
      const status = statusResult.success ? statusResult.data : undefined;

      const items = await partnerStatusConfirmationService.listForHC(user.id, status);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /**
   * GET /api/leader/partner-confirmations
   * TL views confirmations assigned to them.
   */
  listForTL: (async (req, res, next) => {
    try {
      const { user } = req;
      const statusResult = listStatusSchema.safeParse(req.query["status"]);
      const status = statusResult.success ? statusResult.data : undefined;

      const items = await partnerStatusConfirmationService.listForTL(user.id, status);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /**
   * POST /api/leader/partner-confirmations/:id/confirm
   * TL confirms the status.
   */
  confirm: (async (req, res, next) => {
    try {
      const { user } = req;
      const idResult = uuidSchema.safeParse(req.params["id"]);
      if (!idResult.success) throw new ValidationError("Invalid confirmation ID", {});

      const parsed = confirmSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid input", parsed.error.format());

      const result = await partnerStatusConfirmationService.confirm(
        idResult.data,
        parsed.data.status,
        user.id,
        parsed.data.note,
      );

      res.json({ success: true, confirmation: result });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /**
   * POST /api/admin/partner-confirmations/:id/cancel
   * HC cancels a pending request.
   */
  cancel: (async (req, res, next) => {
    try {
      const { user } = req;
      const idResult = uuidSchema.safeParse(req.params["id"]);
      if (!idResult.success) throw new ValidationError("Invalid confirmation ID", {});

      const result = await partnerStatusConfirmationService.cancel(idResult.data, user.id);
      res.json({ success: true, confirmation: result });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
