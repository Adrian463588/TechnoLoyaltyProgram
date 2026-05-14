/**
 * NextAuth v5 Module Augmentation
 *
 * Extends the default Session and JWT types to include
 * loyalty portal custom fields: role, npk, divisionId.
 */

import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      npk: string;
      role: "MITRA" | "TEAM_LEADER" | "HC_PM";
      divisionId?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    npk: string;
    role: "MITRA" | "TEAM_LEADER" | "HC_PM";
    divisionId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    npk: string;
    role: "MITRA" | "TEAM_LEADER" | "HC_PM";
    divisionId?: string;
  }
}
