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

/**
 * @openapi
 * /api/employee/dashboard:
 *   get:
 *     tags:
 *       - Employee
 *     summary: Get employee dashboard data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 */
employeeRoutes.get("/dashboard",     LoyaltyController.getEmployeeDashboard as RequestHandler);

/**
 * @openapi
 * /api/employee/token-summary:
 *   get:
 *     tags:
 *       - Employee
 *     summary: Get employee token summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token summary retrieved
 */
employeeRoutes.get("/token-summary", LoyaltyController.getTokenSummary as RequestHandler);

/**
 * @openapi
 * /api/employee/redemptions:
 *   get:
 *     tags:
 *       - Employee
 *     summary: List employee's redemptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of redemptions
 *   post:
 *     tags:
 *       - Employee
 *     summary: Create a new redemption request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rewardId
 *             properties:
 *               rewardId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Redemption request created
 */
employeeRoutes.get( "/redemptions", RedemptionController.listMyRedemptions as RequestHandler);
employeeRoutes.post("/redemptions", RedemptionController.createRequest as RequestHandler);
