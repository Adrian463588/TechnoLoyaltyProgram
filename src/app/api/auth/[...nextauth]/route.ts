/**
 * NextAuth Route Handler
 * Handles all /api/auth/* routes (signin, signout, session, etc.)
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
