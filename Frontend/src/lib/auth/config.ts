/**
 * NextAuth v5 Node.js Configuration
 *
 * This file merges the edge-safe configuration from `auth.config.ts` with Node.js
 * dependent providers (like Credentials using bcrypt and Prisma).
 *
 * Use this exported `auth`, `signIn`, `signOut`, `handlers` in all Node.js environments
 * (e.g. Server Actions, API routes, Server Components).
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "./auth.config";

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

        const user = await prisma.user.findUnique({
          where: { npk },
          select: {
            id:           true,
            npk:          true,
            name:         true,
            email:        true,
            passwordHash: true,
            role:         true,
            divisionId:   true,
            isActive:     true,
          },
        });

        if (!user || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id:         user.id,
          npk:        user.npk,
          name:       user.name,
          email:      user.email,
          role:       user.role,
          divisionId: user.divisionId ?? undefined,
        };
      },
    }),
  ],
});
