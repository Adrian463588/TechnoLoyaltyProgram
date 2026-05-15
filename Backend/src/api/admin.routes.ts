/**
 * Backend/src/api/admin.routes.ts
 *
 * Express router for HC_PM admin endpoints.
 * All routes require HC_PM role (enforced via middleware).
 *
 * SOLID — SRP: route definitions only — logic lives in controllers.
 * AGENTS.md: Thin routes, no DB calls here.
 */

import { Router, type RequestHandler } from "express";
import { authenticate }                      from "@/middleware/authenticate";
import { authorize }                         from "@/middleware/authorize";
import { RedemptionController }              from "@/controllers/redemption.controller";
import { ManualAdjustmentController }        from "@/controllers/manual-adjustment.controller";
import { RewardCatalogController }           from "@/controllers/reward-catalog.controller";
import { PartnerStatusConfirmationController } from "@/controllers/partner-status-confirmation.controller";
import {
  AdminFoundationController,
  uploadProcessMiddleware,
} from "@/controllers/admin-foundation.controller";

export const adminRoutes = Router();

// ── Apply auth guards to all admin routes ──────────────────────────────────
adminRoutes.use(authenticate, authorize("HC_PM"));

adminRoutes.get("/audit", AdminFoundationController.listAuditLogs as RequestHandler);
adminRoutes.get("/uploads", AdminFoundationController.listUploads as RequestHandler);
adminRoutes.post(
  "/uploads/process",
  uploadProcessMiddleware,
  AdminFoundationController.processUpload as RequestHandler,
);

// ── Redemptions ─────────────────────────────────────────────────────────────
/**
 * @openapi
 * /api/admin/redemptions:
 *   get:
 *     tags: [Admin]
 *     summary: List all redemption requests (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of redemptions retrieved
 */
adminRoutes.get(  "/redemptions",                        RedemptionController.listAll              as RequestHandler);

/**
 * @openapi
 * /api/admin/redemptions/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get redemption detail
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Redemption detail retrieved
 *       404:
 *         description: Redemption not found
 */
adminRoutes.get(  "/redemptions/:id",                    RedemptionController.getById              as RequestHandler);

/**
 * @openapi
 * /api/admin/redemptions/{id}/status:
 *   post:
 *     tags: [Admin]
 *     summary: Update redemption status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED] }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
adminRoutes.post( "/redemptions/:id/status",             RedemptionController.updateStatus         as RequestHandler);

/**
 * @openapi
 * /api/admin/redemptions/{id}/verify-documents:
 *   post:
 *     tags: [Admin]
 *     summary: Mark redemption documents as verified
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Documents verified
 */
adminRoutes.post( "/redemptions/:id/verify-documents",   RedemptionController.verifyDocuments      as RequestHandler);

// ── Manual Token Adjustments (HC-01) ────────────────────────────────────────
/**
 * @openapi
 * /api/admin/adjustments:
 *   post:
 *     tags: [Admin]
 *     summary: Manually adjust user tokens
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount, reason]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               amount: { type: number, description: "Positive to credit, negative to debit" }
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: Tokens adjusted successfully
 */
adminRoutes.post( "/adjustments",                        ManualAdjustmentController.adjust         as RequestHandler);

// ── Reward Catalog Management (HC-02) ───────────────────────────────────────
/**
 * @openapi
 * /api/admin/rewards:
 *   get:
 *     tags: [Admin]
 *     summary: List all rewards in catalog
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Reward list retrieved
 *   post:
 *     tags: [Admin]
 *     summary: Create a new reward
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, tokenCost, stock]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               tokenCost: { type: number }
 *               stock: { type: number }
 *               imageUrl: { type: string }
 *     responses:
 *       201:
 *         description: Reward created
 */
adminRoutes.get(  "/rewards",                            RewardCatalogController.listAll           as RequestHandler);
adminRoutes.post( "/rewards",                            RewardCatalogController.create            as RequestHandler);

/**
 * @openapi
 * /api/admin/rewards/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update an existing reward
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               tokenCost: { type: number }
 *               stock: { type: number }
 *               imageUrl: { type: string }
 *     responses:
 *       200:
 *         description: Reward updated
 *   delete:
 *     tags: [Admin]
 *     summary: Soft-deactivate a reward
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Reward deactivated
 */
adminRoutes.patch("/rewards/:id",                        RewardCatalogController.update            as RequestHandler);
adminRoutes.delete("/rewards/:id",                       RewardCatalogController.deactivate        as RequestHandler);

// ── Partner Status Confirmations (HC-06) ─────────────────────────────────────
/**
 * @openapi
 * /api/admin/partner-confirmations:
 *   get:
 *     tags: [Admin]
 *     summary: List status confirmation requests
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List retrieved
 *   post:
 *     tags: [Admin]
 *     summary: Request partner status confirmation from Team Leader
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, teamLeaderId]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               teamLeaderId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Request created
 */
adminRoutes.get(  "/partner-confirmations",              PartnerStatusConfirmationController.listForHC        as RequestHandler);
adminRoutes.post( "/partner-confirmations",              PartnerStatusConfirmationController.requestConfirmation as RequestHandler);

/**
 * @openapi
 * /api/admin/partner-confirmations/{id}/cancel:
 *   post:
 *     tags: [Admin]
 *     summary: Cancel a pending confirmation request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Request cancelled
 */
adminRoutes.post( "/partner-confirmations/:id/cancel",   PartnerStatusConfirmationController.cancel          as RequestHandler);
