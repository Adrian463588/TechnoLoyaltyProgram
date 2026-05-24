/**
 * Next.js Edge Middleware — Route Protection
 *
 * Runs on every request BEFORE page rendering.
 * Enforces authentication and role-based access at the edge.
 *
 * Protected routes:
 *   /employee/*  → MITRA, TEAM_LEADER, HC_PM
 *   /admin/*     → HC_PM only
 *   /leader/*    → TEAM_LEADER, HC_PM
 *   /api/admin/* → HC_PM only (double-enforcement)
 *
 * Public routes (no auth required):
 *   /login, /api/auth/*, /api/docs/*, /_next/*, /favicon.ico
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);
import { NextResponse, type NextRequest } from "next/server";

// Paths that require no authentication
const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/api/docs",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
];

type Role = "MITRA" | "TEAM_LEADER" | "HC_PM";

const ROUTE_ROLE_MAP: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/admin",       roles: ["HC_PM"] },
  { prefix: "/api/admin",   roles: ["HC_PM"] },
  { prefix: "/leader",      roles: ["TEAM_LEADER", "HC_PM"] },
  { prefix: "/employee",    roles: ["MITRA", "TEAM_LEADER", "HC_PM"] },
];

const ROLE_HIERARCHY: Record<Role, number> = {
  MITRA: 1, TEAM_LEADER: 2, HC_PM: 3,
};

// NextAuth v5: export auth as the middleware function directly
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.auth;

  // Not authenticated → redirect to login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (session.user as { role?: string }).role as Role | undefined;
  const userLevel = userRole ? (ROLE_HIERARCHY[userRole] ?? 0) : 0;

  // Check role requirements for the matched route prefix
  for (const { prefix, roles } of ROUTE_ROLE_MAP) {
    if (pathname.startsWith(prefix)) {
      const hasAccess = roles.some((r) => ROLE_HIERARCHY[r] <= userLevel);
      if (!hasAccess) {
        const fallback =
          userRole === "HC_PM"         ? "/admin/dashboard"
          : userRole === "TEAM_LEADER" ? "/employee/dashboard"
          : "/employee/dashboard";
        return NextResponse.redirect(new URL(fallback, req.url));
      }
      break;
    }
  }

  // Add security headers to every response
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}) as (req: NextRequest) => Response | Promise<Response>;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|fonts|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
