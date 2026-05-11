# Backend/Dockerfile
# Multi-stage build for GCP Cloud Run (asia-southeast2 / Jakarta)
# Target: minimal production image, no dev dependencies.

# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src/           ./src/
COPY prisma/        ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# ── Stage 2: Production runner ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Production-only environment
ENV NODE_ENV=production

# Copy compiled output and production deps
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma       ./prisma
COPY --from=builder /app/package.json ./

# Cloud Run listens on PORT (default 8080)
EXPOSE 8080

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/app.js"]
