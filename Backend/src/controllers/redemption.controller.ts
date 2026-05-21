/**
 * Backend/src/controllers/redemption.controller.ts
 *
 * HTTP request handlers for redemption endpoints.
 * Thin layer: parse → validate → call service → respond.
 *
 * SOLID — SRP: only handles HTTP parsing/responding, no business logic.
 */

import type { RequestHandler } from "express";
import { z } from "zod";
import { redemptionService } from "@/services/redemption.service";
import { redeemRequestSchema, updateStatusSchema, uuidSchema, redemptionVerificationSchema } from "@/types/validations";
import { ValidationError } from "@/errors/validation-error";
import { NotFoundError } from "@/errors/not-found-error";

export const RedemptionController = {

  // GET /api/admin/redemptions — HC_ADMIN: list all requests
  listAll: (async (_req, res, next) => {
    try {
      const requests = await redemptionService.listAll();
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // GET /api/admin/redemptions/:id
  getById: (async (req, res, next) => {
    try {
      const idParam = req.params["id"];
      const idResult = uuidSchema.safeParse(idParam);
      if (!idResult.success) {
        throw new ValidationError("Invalid request ID format", { id: idParam });
      }

      const request = await redemptionService.getById(idResult.data);
      if (!request) {
        throw new NotFoundError("Redemption request", idResult.data);
      }
      res.json(request);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // GET /api/employee/redemptions — current user's history
  listMyRedemptions: (async (req, res, next) => {
    try {
      const { user } = req;
      const requests = await redemptionService.listByMitra(user.id);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/employee/redemptions — submit new request
  createRequest: (async (req, res, next) => {
    try {
      const { user } = req;
      const parsed = redeemRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new ValidationError("Invalid input", z.treeifyError(parsed.error));
      }

      const powerOfAttorneyUrl = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

      const redemption = await redemptionService.submitRequest(
        user.id,
        parsed.data.rewardItemId,
        {
          isRepresented: parsed.data.isRepresented,
          powerOfAttorneyUrl,
        }
      );
      res.status(201).json(redemption);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/redemptions/:id/status — HC_ADMIN: update status
  updateStatus: (async (req, res, next) => {
    try {
      const { user } = req;

      // Validate path parameter
      const idParam = req.params["id"];
      const idResult = uuidSchema.safeParse(idParam);
      if (!idResult.success) {
        throw new ValidationError("Invalid request ID format", { id: idParam });
      }

      // Validate body
      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          "Invalid status parameters",
          z.treeifyError(parsed.error),
        );
      }

      const result = await redemptionService.transitionStatus(
        idResult.data,
        parsed.data.status,
        user.id,
        parsed.data.reason,
      );

      res.json({
        success: true,
        message: `Status updated to ${parsed.data.status}`,
        request: result,
      });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/redemptions/:id/verify-documents — HC_ADMIN: verify docs
  verifyDocuments: (async (req, res, next) => {
    try {
      const { user } = req;

      const idParam = req.params["id"];
      const idResult = uuidSchema.safeParse(idParam);
      if (!idResult.success) {
        throw new ValidationError("Invalid request ID format", { id: idParam });
      }

      const parsed = redemptionVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid verification data", z.treeifyError(parsed.error));
      }

      const result = await redemptionService.verifyDocuments(
        idResult.data,
        parsed.data,
        user.id,
      );

      res.json({
        success: true,
        message: "Documents verified successfully",
        request: result,
      });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
