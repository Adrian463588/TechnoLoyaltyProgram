/**
 * Backend/src/controllers/notifications.controller.ts
 *
 * Stub controller — returns empty notifications list.
 * TODO(OQ-NOTIF-001): implement real notification system when backend events are defined.
 */

import type { RequestHandler } from "express";

export const NotificationsController = {
  // GET /api/employee/notifications
  list: ((_req, res) => {
    res.json({ notifications: [], total: 0 });
  }) satisfies RequestHandler,
};
