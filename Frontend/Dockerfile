# Frontend/Dockerfile
# Multi-stage build for GCP Cloud Run using Next.js standalone output mode.

# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build Next.js in standalone mode (set in next.config.ts: output: 'standalone')
RUN npm run build

# ── Stage 2: Production runner ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry in production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone build includes its own node_modules copy
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

# Cloud Run uses PORT env variable
EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
