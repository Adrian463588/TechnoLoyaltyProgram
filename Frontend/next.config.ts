import type { NextConfig } from "next";
import path from "path";

/**
 * Frontend/next.config.ts
 * Next.js 16 — optimised for dev memory + GCP Cloud Run deployment.
 */
const nextConfig: NextConfig = {
  // ── Turbopack Optimisation ───────────────────────────────────────────────
  // Explicitly set root to the monorepo root to avoid "multiple lockfiles" warnings.
  turbopack: {
    root: __dirname,
  },

  experimental: {
    // Other experimental features would go here
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // ── Standalone output: ONLY in production builds ─────────────────────────
  // In dev, this causes extra file-tracing on every HMR cycle → RAM bloat.
  ...(process.env.NODE_ENV === "production" && { output: "standalone" }),

  // ── Prevent framer-motion from being server-side bundled ─────────────────
  // (Removed serverExternalPackages: breaks SSR context due to 'use client' boundary bypass)

  // ── Type-safe routing ────────────────────────────────────────────────────
  // Disable in dev if it's causing slow startup/HMR.
  typedRoutes: false,

  // ── Memory optimization for dev mode (Webpack fallback) ──────────────────
  experimental: {
    webpackMemoryOptimizations: true,
  },

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
  
  // Disable source maps to save RAM during builds
  productionBrowserSourceMaps: false,
};

export default nextConfig;

