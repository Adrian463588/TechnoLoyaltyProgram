import { asyncHandler } from "@/middleware/asyncHandler";
import { notificationService } from "@/services/notification.service";

export const NotificationsController = {
  list: asyncHandler(async (req, res) => {
    res.json(await notificationService.listForUser(req.user.id));
  }),
};
