/**
 * Backend/src/services/profile.service.ts
 *
 * Read/update user profile. Non-critical fields only (name, email).
 * NPK is immutable — cannot be changed here.
 */

import { prisma } from "@/db/prisma";

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
};
