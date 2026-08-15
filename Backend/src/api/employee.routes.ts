/**
 * Backend/src/api/employee.routes.ts
 *
 * Express router for MITRA/employee endpoints.
 * Accessible by MITRA, TEAM_LEADER, and HC_PM (all authenticated users).
 */

import { Router } from "express";
import { authenticate }         from "@/middleware/authenticate";
import { authorize }            from "@/middleware/authorize";
import { RedemptionController }    from "@/controllers/redemption.controller";
import { LoyaltyController }        from "@/controllers/loyalty.controller";
import { RewardCatalogController }  from "@/controllers/reward-catalog.controller";
import { NotificationsController }  from "@/controllers/notifications.controller";
import { ProfileController }        from "@/controllers/profile.controller";
import { DocumentController }       from "@/controllers/document.controller";

export const employeeRoutes = Router();

// ── Apply auth guards ─────────────────────────────────────────────────────
employeeRoutes.use(authenticate);

const allowAll = authorize("MITRA", "TEAM_LEADER", "HC_PM");
const allowMitraAndHC = authorize("MITRA", "HC_PM");

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
employeeRoutes.get("/dashboard", allowAll, LoyaltyController.getEmployeeDashboard);

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
employeeRoutes.get("/token-summary", allowAll, LoyaltyController.getTokenSummary);

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
employeeRoutes.get( "/redemptions", allowMitraAndHC, RedemptionController.listMyRedemptions);
employeeRoutes.post("/redemptions", allowMitraAndHC, DocumentController.uploadMiddleware, RedemptionController.createRequest);
employeeRoutes.post("/redemptions/:id/cancel", allowMitraAndHC, RedemptionController.cancelRequest);

// ── Reward Catalog (read-only for employees) ───────────────────────────────
/**
 * @openapi
 * /api/employee/rewards:
 *   get:
 *     tags: [Employee]
 *     summary: List all active rewards available for redemption
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of active rewards retrieved
 */
employeeRoutes.get( "/rewards", allowMitraAndHC, RewardCatalogController.listActive);

// ── Token Ledger History ───────────────────────────────────────────────────
employeeRoutes.get("/history", allowAll, LoyaltyController.getTokenHistory);

// ── Documents ─────────────────────────────────────────────────────────────
employeeRoutes.get(  "/documents", allowMitraAndHC, DocumentController.listDocuments);
employeeRoutes.post( "/documents/upload", allowMitraAndHC, DocumentController.uploadMiddleware, DocumentController.uploadDocument);
employeeRoutes.delete("/documents/:type", allowMitraAndHC, DocumentController.deleteDocument);

// ── Notifications (stub) ───────────────────────────────────────────────────
employeeRoutes.get("/notifications", allowAll, NotificationsController.list);

// ── Profile ────────────────────────────────────────────────────────────────
employeeRoutes.get( "/profile", allowAll, ProfileController.get);
employeeRoutes.patch("/profile", allowAll, ProfileController.update);
employeeRoutes.post( "/profile/change-password", allowAll, ProfileController.changePassword);
