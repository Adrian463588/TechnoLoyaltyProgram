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

  // GET /api/admin/redemptions — list all for HC
  listAll: (async (req, res, next) => {
    try {
      const limit = Number(req.query["limit"]) || 100;
      const offset = Number(req.query["offset"]) || 0;
      const status = req.query["status"] as any;

      const { requests, total } = await redemptionService.listAll({ status, limit, offset });
      const mapped = requests.map((r) => {
        // Use type-safe property access from prisma include results
        return {
          id: r.id,
          status: r.status,
          createdAt: r.submittedAt.toISOString(),
          mitra: {
            id: r.mitra.id,
            name: r.mitra.name,
            email: r.mitra.email,
            npk: r.mitra.npk,
            division: r.mitra.division,
            documents: r.mitra.documents.map(d => ({
              id: d.id,
              type: d.type,
              fileUrl: d.fileUrl
            })),
          },
          item: {
            id: r.rewardItem.id,
            name: r.rewardItem.name,
            tokenCost: r.tokenCost,
          },
          isRepresented: r.isRepresented,
          powerOfAttorneyUrl: r.powerOfAttorneyUrl,
          rejectReason: r.rejectionReason,
        };
      });
      res.json({
        total,
        limit,
        offset,
        requests: mapped
      });
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
      const mapped = requests.map((r) => ({
        id: r.id,
        status: r.status,
        // BUG-001 FIX: RedemptionRequest.createdAt does not exist in Prisma schema.
        // The correct field is submittedAt (matches listAll on line 32).
        createdAt: r.submittedAt.toISOString(),
        item: {
          id: r.rewardItem.id,
          name: r.rewardItem.name,
          tokenCost: r.tokenCost,
        },
        isRepresented: r.isRepresented,
        powerOfAttorneyUrl: r.powerOfAttorneyUrl,
        idCardVerified: r.idCardVerified,
        ktpVerified: r.ktpVerified,
        npwpVerified: r.npwpVerified,
        powerOfAttorneyVerified: r.powerOfAttorneyVerified,
        rejectReason: r.rejectionReason ?? "Alasan tidak disebutkan oleh HC.",
        mitra: (r as any).mitra ? {
          documents: (r as any).mitra.documents.map((d: any) => ({
            id: d.id,
            type: d.type,
            fileUrl: d.fileUrl
          }))
        } : null
      }));
      res.json(mapped);
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
        } as any
      );
      res.status(201).json(redemption);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // GET /api/leader/redemptions — list for division/team
  listForLeader: (async (req, res, next) => {
    try {
      const { user } = req;
      const limit = Number(req.query["limit"]) || 100;
      const offset = Number(req.query["offset"]) || 0;
      const status = req.query["status"] as any;

      if (!user.division) {
        res.status(400).json({ error: "User division not found in session." });
        return;
      }

      const { requests, total } = await redemptionService.listByDivision(user.division, { status, limit, offset });
      const mapped = requests.map((r) => {
        return {
          id: r.id,
          status: r.status,
          createdAt: r.submittedAt.toISOString(),
          mitra: {
            id: r.mitra.id,
            name: r.mitra.name,
            email: r.mitra.email,
            npk: r.mitra.npk,
            division: r.mitra.division,
            documents: r.mitra.documents.map(d => ({
              id: d.id,
              type: d.type,
              fileUrl: d.fileUrl
            })),
          },
          item: {
            id: r.rewardItem.id,
            name: r.rewardItem.name,
            tokenCost: r.tokenCost,
          },
          isRepresented: r.isRepresented,
          powerOfAttorneyUrl: r.powerOfAttorneyUrl,
          rejectReason: r.rejectionReason,
        };
      });
      res.json({
        total,
        limit,
        offset,
        requests: mapped
      });
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

  // POST /api/employee/redemptions/:id/cancel — Mitra: cancel own request
  cancelRequest: (async (req, res, next) => {
    try {
      const { user } = req;
      const idParam = req.params["id"];
      const idResult = uuidSchema.safeParse(idParam);
      if (!idResult.success) {
        throw new ValidationError("Invalid request ID format", { id: idParam });
      }

      // Check if the redemption belongs to the user and is in a cancellable state
      const request = await redemptionService.getById(idResult.data);
      if (!request) {
        throw new NotFoundError("Redemption request", idResult.data);
      }

      if (request.mitraId !== user.id) {
        throw new ValidationError("You can only cancel your own redemption requests.");
      }

      if (!["REQUESTED", "REVIEWED"].includes(request.status)) {
        throw new ValidationError("Only requests in 'REQUESTED' or 'REVIEWED' status can be cancelled by employee.");
      }

      const result = await redemptionService.transitionStatus(
        idResult.data,
        "CANCELLED",
        user.id,
        "Cancelled by employee",
      );

      res.json({
        success: true,
        message: "Redemption successfully cancelled",
        request: result,
      });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
