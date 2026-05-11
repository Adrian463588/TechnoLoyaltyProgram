/**
 * Backend/src/api/admin.routes.ts
 *
 * Express router for HC_PM admin endpoints.
 * All routes require HC_PM role.
 *
 * SOLID — SRP: route definitions only — logic lives in controllers.
 */

import { Router } from "express";
import { authenticate }          from "@/middleware/authenticate";
import { authorize }             from "@/middleware/authorize";
import { RedemptionController }  from "@/controllers/redemption.controller";
import { UploadController }      from "@/controllers/upload.controller";

export const adminRoutes: Router = Router();

// ── Apply auth guards to all admin routes ─────────────────────────────────
adminRoutes.use(authenticate, authorize("HC_PM"));

// ── Redemption management ──────────────────────────────────────────────────
adminRoutes.get(  "/redemptions",              RedemptionController.listAll);
adminRoutes.get(  "/redemptions/:id",          RedemptionController.getById);
adminRoutes.post( "/redemptions/:id/status",   RedemptionController.updateStatus);

// ── Upload pipeline ────────────────────────────────────────────────────────
adminRoutes.get(  "/uploads",                  UploadController.listAll);
adminRoutes.post( "/uploads",                  UploadController.stageFile);
adminRoutes.post( "/uploads/process",          UploadController.processFile);
adminRoutes.get(  "/uploads/:id",              UploadController.getById);
adminRoutes.post( "/uploads/:id/commit",       UploadController.commitUpload);
