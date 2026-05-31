/**
 * NextAuth v5 Node.js Configuration
 *
 * The Frontend doesn't access the database directly.
 * Credentials verification is delegated to the Backend REST API.
 *
 * SOLID — SRP: auth module only handles session/JWT, not DB queries.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "./auth.config";

const RAW_BACKEND_URL = process.env["BACKEND_URL"] ?? "http://localhost:8080";
// Safely strip trailing /api or slashes to prevent the /api/api routing bug
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

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
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { npk, password } = parsed.data;

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ npk, password }),
          });

          if (!res.ok) {
            console.error(`[NextAuth] Backend rejected login with status: ${res.status}`);
            return null;
          }

          const data = (await res.json()) as {
            user: {
              id: string;
              name: string;
              email: string;
              npk: string;
              role: "MITRA" | "TEAM_LEADER" | "HC_PM";
              division: string;
              partnerStatus: string;
            };
          };

          if (!data?.user) return null;

          return {
            id:            data.user.id,
            name:          data.user.name,
            email:         data.user.email,
            npk:           data.user.npk,
            role:          data.user.role,
            division:      data.user.division,
            partnerStatus: data.user.partnerStatus,
          };
        } catch (error) {
          console.error("[NextAuth] Network or Server Error during authentication:", error);
          return null;
        }
      },
    }),
  ],
});
