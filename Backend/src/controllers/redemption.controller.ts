/**
 * Backend/src/controllers/redemption.controller.ts
 *
 * HTTP request handlers for redemption endpoints.
 * Thin layer: parse → validate → call service → respond.
 *
 * SOLID — SRP: only handles HTTP parsing/responding, no business logic.
 */

import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "@/types/api.types";
import { RedemptionService } from "@/services/redemption.service";
import { redeemRequestSchema, updateStatusSchema } from "@/types/validations";

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
      const request = await RedemptionService.getById(req.params["id"]!);
      if (!request) {
        res.status(404).json({ error: "Redemption request not found" });
        return;
      }
      res.json(request);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // GET /api/employee/redemptions — current user's history
  listMyRedemptions: (async (req, res, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const requests = await RedemptionService.listByUser(user.id);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/employee/redemptions — submit new request
  createRequest: (async (req, res, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const parsed   = redeemRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error:   "Invalid input",
          details: parsed.error.flatten(),
        });
        return;
      }

      const redemption = await RedemptionService.createRequest(user.id, parsed.data.rewardItemId);
      res.status(201).json(redemption);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/redemptions/:id/status — HC_PM: update status
  updateStatus: (async (req, res, next) => {
    try {
      const { user }  = req as AuthenticatedRequest;
      const parsed    = updateStatusSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error:   "Invalid status parameters",
          details: parsed.error.flatten(),
        });
        return;
      }

      const result = await RedemptionService.updateStatus(
        req.params["id"]!,
        parsed.data.status,
        user.id,
        parsed.data.reason
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
