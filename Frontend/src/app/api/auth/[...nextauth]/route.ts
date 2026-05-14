/**
 * NextAuth v5 API route handler
 *
 * Next.js App Router requires named exports GET and POST from the handlers object.
 * This is the correct pattern for NextAuth v5 with Next.js 15+.
 */
import { handlers } from "@/lib/auth";

export const GET  = handlers.GET;
export const POST = handlers.POST;
