/**
 * NextAuth v5 Node.js Configuration
 *
 * The Frontend doesn't access the database directly.
 * Credentials verification is delegated to the Backend REST API.
 *
 * SOLID — SRP: auth module only handles session/JWT, not DB queries.
 * DRY: BACKEND_URL sourced from the centralized backend-url utility.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "./auth.config";
import { BACKEND_URL } from "@/lib/backend-url";

// ── Payload Contract — matches Backend /api/auth/login response ───────────

interface BackendUser {
  id: string;
  name: string;
  email: string;
  npk: string;
  role: "MITRA" | "TEAM_LEADER" | "HC_PM";
  division: string;
  partnerStatus: string;
}

interface BackendLoginResponse {
  user: BackendUser;
}

// ── NextAuth Configuration ─────────────────────────────────────────────────

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        npk:      { label: "NPK",      type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate shape before hitting the network (fail-fast)
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { npk, password } = parsed.data;
        const loginUrl = `${BACKEND_URL}/api/auth/login`;

        try {
          const res = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ npk, password }),
          });

          if (!res.ok) {
            return null;
          }

          const data = (await res.json()) as BackendLoginResponse;

          if (!data?.user) {
            return null;
          }

          return {
            id:            data.user.id,
            name:          data.user.name,
            email:         data.user.email,
            npk:           data.user.npk,
            role:          data.user.role,
            division:      data.user.division,
            partnerStatus: data.user.partnerStatus,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
