/**
 * Backend/src/api/employee.routes.ts
 *
 * Express router for MITRA/employee endpoints.
 * Accessible by MITRA, TEAM_LEADER, and HC_PM (all authenticated users).
 */

import { Router, type RequestHandler } from "express";
import { authenticate }         from "@/middleware/authenticate";
import { authorize }            from "@/middleware/authorize";
import { RedemptionController } from "@/controllers/redemption.controller";
import { LoyaltyController }    from "@/controllers/loyalty.controller";

export const employeeRoutes = Router();

// ── Apply auth guards ─────────────────────────────────────────────────────
employeeRoutes.use(authenticate, authorize("MITRA", "TEAM_LEADER", "HC_PM"));

// ── Dashboard / loyalty data ───────────────────────────────────────────────
employeeRoutes.get("/dashboard",     LoyaltyController.getEmployeeDashboard as RequestHandler);
employeeRoutes.get("/token-summary", LoyaltyController.getTokenSummary as RequestHandler);

// ── Redemptions ────────────────────────────────────────────────────────────
employeeRoutes.get( "/redemptions", RedemptionController.listMyRedemptions as RequestHandler);
employeeRoutes.post("/redemptions", RedemptionController.createRequest as RequestHandler);
