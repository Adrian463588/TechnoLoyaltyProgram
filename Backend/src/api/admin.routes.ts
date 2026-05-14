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
adminRoutes.use(authenticate, authorize("HC_PM"));

/**
 * @openapi
 * /api/admin/redemptions:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all redemption requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of redemptions
 */
adminRoutes.get(  "/redemptions",              RedemptionController.listAll as RequestHandler);

/**
 * @openapi
 * /api/admin/redemptions/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get redemption request by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Redemption details
 *       404:
 *         description: Redemption not found
 */
adminRoutes.get(  "/redemptions/:id",          RedemptionController.getById as RequestHandler);

/**
 * @openapi
 * /api/admin/redemptions/{id}/status:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Update redemption status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
adminRoutes.post( "/redemptions/:id/status",   RedemptionController.updateStatus as RequestHandler);

/**
 * @openapi
 * /api/admin/redemptions/{id}/verify-documents:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Verify redemption documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idCardVerified:
 *                 type: boolean
 *               ktpVerified:
 *                 type: boolean
 *               npwpVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Documents verified
 */
adminRoutes.post( "/redemptions/:id/verify-documents", RedemptionController.verifyDocuments as RequestHandler);
