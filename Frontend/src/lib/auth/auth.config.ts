/**
 * NextAuth v5 Edge Configuration
 *
 * This file contains the Auth.js configuration that is safe to run in the Edge runtime
 * (i.e. middleware.ts). It does NOT include providers that rely on Node.js APIs (like bcrypt or Prisma).
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id ?? "";
        token.npk        = (user as { npk: string }).npk;
        token.role       = (user as { role: "MITRA" | "TEAM_LEADER" | "HC_PM" }).role;
        token.divisionId = (user as { divisionId?: string }).divisionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        const user = session.user as unknown as Record<string, unknown>;
        user.npk        = token.npk;
        user.role       = token.role;
        user.divisionId = token.divisionId;
      }
      return session;
    },
  },
  providers: [], // Add providers in the Node.js compatible auth configuration
} satisfies NextAuthConfig;
