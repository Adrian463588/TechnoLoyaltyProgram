/**
 * Backend/src/services/auth.service.ts
 *
 * Authentication domain logic — isolated from HTTP concerns.
 * SOLID — SRP: only handles identity verification.
 * AGENTS.md: No DB calls in route handlers.
 */

import { prisma } from "@/db/prisma";
import bcrypt from "bcryptjs";
import { ValidationError } from "@/errors/index";

export interface AuthenticatedUserPayload {
  id: string;
  name: string;
  email: string;
  npk: string;
  role: string;
  division: string;
}

export class AuthService {
  /**
   * Validates NPK + password credentials and returns safe user payload.
   * Throws typed errors — never raw strings.
   */
  async login(npk: string, password: string): Promise<AuthenticatedUserPayload> {
    const user = await prisma.user.findUnique({
      where: { npk },
      select: {
        id:            true,
        name:          true,
        email:         true,
        npk:           true,
        division:      true,
        role:          true,
        partnerStatus: true,
        passwordHash:  true,
      },
    });

    // Unified "invalid credentials" for security — do not reveal whether user exists
    if (!user || user.partnerStatus === "RESIGNED") {
      throw new ValidationError("Invalid credentials.");
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new ValidationError("Invalid credentials.");
    }

    return {
      id:       user.id,
      name:     user.name,
      email:    user.email,
      npk:      user.npk,
      role:     user.role,
      division: user.division,
    };
  }
}

export const authService = new AuthService();
