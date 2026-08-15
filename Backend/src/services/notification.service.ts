import { notificationRepository } from "@/repositories/notification.repository";

export class NotificationService {
  async listForUser(userId: string) {
    const [recentTokens, recentRedemptions, recentReminders] = await notificationRepository.findRecentForUser(userId);
    const notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: "INFO" | "SUCCESS" | "WARNING" | "ALERT";
      createdAt: Date;
      read: boolean;
    }> = [];

    for (const item of recentRedemptions) {
      notifications.push({
        id: `redemption-${item.id}`,
        title: `Redemption: ${item.rewardItem.name}`,
        message: `Status updated to ${item.status}${item.pickupScheduledAt ? ` — Pickup scheduled for ${item.pickupScheduledAt.toLocaleDateString()}` : ""}`,
        type: ["PURCHASED", "PICKUP_SCHEDULED", "COMPLETED"].includes(item.status)
          ? "SUCCESS"
          : item.status === "REJECTED" ? "ALERT" : "INFO",
        createdAt: item.updatedAt,
        read: false,
      });
    }

    for (const item of recentTokens) {
      if (item.eventType === "EARNED_SHIFT" || item.eventType === "EARNED_PROJECT") {
        notifications.push({
          id: `token-${item.id}`,
          title: "Tokens Credited",
          message: `+${item.amount} tokens received from ${item.eventType === "EARNED_SHIFT" ? "Shift" : "Project"} work.`,
          type: "SUCCESS",
          createdAt: item.createdAt,
          read: false,
        });
      } else if (item.eventType === "EXPIRED" || item.eventType === "DOWNGRADE_PENALTY") {
        notifications.push({
          id: `token-${item.id}`,
          title: "Token Expiry / Adjustment",
          message: `${item.amount} tokens adjusted. Reason: ${item.reason ?? "Policy Evaluation"}`,
          type: "WARNING",
          createdAt: item.createdAt,
          read: false,
        });
      }
    }

    for (const item of recentReminders) {
      notifications.push({
        id: `expiry-reminder-${item.id}`,
        title: "Token Expiry Reminder",
        message: "Some token cohorts expire within 30 days. Review your token expiry details.",
        type: "WARNING",
        createdAt: item.createdAt,
        read: false,
      });
    }

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
      notifications: notifications.slice(0, 10),
      total: notifications.length,
    };
  }
}

export const notificationService = new NotificationService();
