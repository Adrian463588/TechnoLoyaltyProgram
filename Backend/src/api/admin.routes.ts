/**
 * Backend/src/api/admin.routes.ts
 *
 * Express router for HC_ADMIN admin endpoints.
 * All routes require HC_ADMIN role.
 *
 * SOLID — SRP: route definitions only — logic lives in controllers.
 */

import { Router, type RequestHandler } from "express";
import { authenticate }          from "@/middleware/authenticate";
import { authorize }             from "@/middleware/authorize";
import { RedemptionController }  from "@/controllers/redemption.controller";

export const adminRoutes = Router();

// ── Apply auth guards to all admin routes ─────────────────────────────────
adminRoutes.use(authenticate, authorize("HC_ADMIN"));

// ── Redemption management ──────────────────────────────────────────────────
adminRoutes.get(  "/redemptions",              RedemptionController.listAll as RequestHandler);
adminRoutes.get(  "/redemptions/:id",          RedemptionController.getById as RequestHandler);
adminRoutes.post( "/redemptions/:id/status",   RedemptionController.updateStatus as RequestHandler);
adminRoutes.post( "/redemptions/:id/verify-documents", RedemptionController.verifyDocuments as RequestHandler);
