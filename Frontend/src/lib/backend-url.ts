/**
 * Frontend/src/lib/backend-url.ts
 *
 * Single source of truth for backend base URL resolution.
 *
 * SOLID — SRP: Only responsible for resolving and sanitizing the backend base URL.
 * DRY: Eliminates the repeated regex-strip pattern that was duplicated
 *      across api-client/index.ts and auth/config.ts.
 *
 * Two URLs are necessary because Next.js has two execution contexts:
 *   - Server context (NextAuth authorize, Server Actions, Route Handlers):
 *     Must use BACKEND_URL — an internal/private URL reachable from the
 *     Next.js container (e.g., a Docker internal hostname or localhost).
 *   - Browser context (client components, browser fetch):
 *     Must use NEXT_PUBLIC_BACKEND_URL — the public FQDN that the user's
 *     browser can reach directly.
 */

/** Strips trailing slashes and a trailing /api segment. */
function sanitize(raw: string): string {
  return raw.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

/**
 * Server-side backend URL.
 * Used by NextAuth `authorize`, Server Actions, and Route Handlers.
 * Maps to the `BACKEND_URL` environment variable.
 *
 * If this falls back to localhost:8080, it means BACKEND_URL is missing
 * from the runtime environment — check Coolify → Frontend App → Env Vars.
 */
export const BACKEND_URL = sanitize(
  process.env["BACKEND_URL"] ?? "http://localhost:8080",
);

/**
 * Public (browser-side) backend URL.
 * Used by `api-client` for client-component fetch calls.
 * Maps to the `NEXT_PUBLIC_BACKEND_URL` environment variable.
 */
export const PUBLIC_BACKEND_URL = sanitize(
  process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8080",
);
