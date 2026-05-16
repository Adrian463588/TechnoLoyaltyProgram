import type { NextConfig } from "next";

/**
 * Frontend/next.config.ts
 * Next.js 16 — optimised for dev memory + GCP Cloud Run deployment.
 */
const nextConfig: NextConfig = {
  // ── Standalone output: ONLY in production builds ─────────────────────────
  // In dev, this causes extra file-tracing on every HMR cycle → RAM bloat.
  ...(process.env.NODE_ENV === "production" && { output: "standalone" }),

  // ── Prevent framer-motion from being server-side bundled ─────────────────
  // (Removed serverExternalPackages: breaks SSR context due to 'use client' boundary bypass)

  // ── Type-safe routing ────────────────────────────────────────────────────
  typedRoutes: true,

  // ── Server-only env vars passed to client ───────────────────────────────
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "",
  },

  // ── Image optimization ──────────────────────────────────────────────────
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;

