/**
 * Backend/src/api/admin.routes.ts
 *
 * Express router for HC_PM admin endpoints.
 * All routes require HC_PM role.
 *
 * SOLID — SRP: route definitions only — logic lives in controllers.
 */

import { Router, type RequestHandler } from "express";
import { authenticate }          from "@/middleware/authenticate";
import { authorize }             from "@/middleware/authorize";
import { RedemptionController }  from "@/controllers/redemption.controller";
import { UploadController, uploadMiddleware } from "@/controllers/upload.controller";

export const adminRoutes = Router();

// ── Apply auth guards to all admin routes ─────────────────────────────────
adminRoutes.use(authenticate, authorize("HC_PM"));

// ── Redemption management ──────────────────────────────────────────────────
adminRoutes.get(  "/redemptions",              RedemptionController.listAll as RequestHandler);
adminRoutes.get(  "/redemptions/:id",          RedemptionController.getById as RequestHandler);
adminRoutes.post( "/redemptions/:id/status",   RedemptionController.updateStatus as RequestHandler);

// ── Upload pipeline ────────────────────────────────────────────────────────
adminRoutes.get(  "/uploads",                  UploadController.listAll as RequestHandler);
adminRoutes.post( "/uploads",                  uploadMiddleware, UploadController.stageFile as RequestHandler);
adminRoutes.post( "/uploads/process",          uploadMiddleware, UploadController.processFile as RequestHandler);
adminRoutes.get(  "/uploads/:id",              UploadController.getById as RequestHandler);
adminRoutes.post( "/uploads/:id/commit",       UploadController.commitUpload as RequestHandler);
