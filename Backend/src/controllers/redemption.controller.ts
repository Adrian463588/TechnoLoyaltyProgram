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
import { RedemptionService } from "@/services/redemption.service";
import { redeemRequestSchema, updateStatusSchema, uuidSchema } from "@/types/validations";
import { ValidationError } from "@/errors/validation-error";
import { NotFoundError } from "@/errors/not-found-error";

export const RedemptionController = {

  // GET /api/admin/redemptions — HC_PM: list all requests
  listAll: (async (_req, res, next) => {
    try {
      const requests = await RedemptionService.listAll();
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

      const request = await RedemptionService.getById(idResult.data);
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
      const requests = await RedemptionService.listByUser(user.id);
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

      const redemption = await RedemptionService.createRequest(
        user.id,
        parsed.data.rewardItemId,
        req.ip,
      );
      res.status(201).json(redemption);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/redemptions/:id/status — HC_PM: update status
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

      const result = await RedemptionService.updateStatus(
        idResult.data,
        parsed.data.status,
        user.id,
        parsed.data.reason,
        req.ip,
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
};
