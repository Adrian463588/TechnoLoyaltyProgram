import type { NextConfig } from "next";

/**
 * Frontend/next.config.ts
 *
 * Next.js 16 configuration for GCP Cloud Run deployment.
 * Uses standalone output mode for minimal Docker image size.
 */
const nextConfig: NextConfig = {
  // ── GCP Cloud Run: standalone bundle ────────────────────────────────────
  output: "standalone",

  // ── Type-safe routing (Next.js experimental) ────────────────────────────
  experimental: {
    typedRoutes: true,
  },

  // ── Server-only env vars passed to client ───────────────────────────────
  // Do NOT put secrets here — use process.env directly in server components
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "",
  },

  // ── Image optimization ──────────────────────────────────────────────────
  images: {
    remotePatterns: [
      // Add your GCP Storage bucket domain here
      // { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
