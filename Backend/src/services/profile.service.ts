/**
 * Backend/src/services/profile.service.ts
 *
 * Read/update user profile. Non-critical fields only (name, email).
 * NPK is immutable — cannot be changed here.
 */

import { prisma } from "@/db/prisma";
import bcrypt from "bcryptjs";
import { ValidationError } from "@/errors/index";

export const ProfileService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        npk: true,
        email: true,
        role: true,
        division: true,
        createdAt: true,
      },
    });
    return user;
  },

  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name  !== undefined && { name:  data.name }),
        ...(data.email !== undefined && { email: data.email }),
      },
      select: {
        id: true,
        name: true,
        npk: true,
        email: true,
        role: true,
      },
    });
    return updated;
  },

  async changePassword(userId: string, currentPassword?: string, newPassword?: string) {
    if (!currentPassword || !newPassword) {
      throw new ValidationError("Current password and new password are required.");
    }
    
    if (currentPassword === newPassword) {
      throw new ValidationError("New password must be different from current password.");
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true }
    });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ValidationError("Invalid current password.");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    return { success: true };
  },
};
