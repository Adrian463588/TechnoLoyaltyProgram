/**
 * Backend/src/services/system-setting.service.ts
 *
 * Service for managing global system configurations like earning periods
 * and reward pickup settings.
 *
 * SOLID — SRP: logic for system settings only.
 */

import { prisma } from "@/db/prisma";
import { NotFoundError } from "@/errors";

export class SystemSettingService {
  private readonly DEFAULT_ID = "GLOBAL_CONFIG";

  /**
   * Get global settings, creating them with defaults if they don't exist.
   */
  async getSettings() {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: this.DEFAULT_ID },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { id: this.DEFAULT_ID },
      });
    }

    return settings;
  }

  /**
   * Update global settings.
   */
  async updateSettings(data: {
    p1Start?: string;
    p1End?: string;
    p2Start?: string;
    p2End?: string;
    claimP1Start?: string;
    claimP1End?: string;
    claimP2Start?: string;
    claimP2End?: string;
    rewardPickupLocation?: string;
    updatedBy?: string;
  }) {
    const existing = await this.getSettings();

    return prisma.systemSetting.update({
      where: { id: existing.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}

export const systemSettingService = new SystemSettingService();
