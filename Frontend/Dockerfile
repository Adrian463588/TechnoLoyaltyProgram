# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
# Install ALL dependencies (including devDependencies) so Tailwind/TypeScript work
COPY package.json package-lock.json ./
RUN npm install --include=dev
COPY . .
# Enforce production mode for the build so Next.js optimizes _global-error correctly
ENV NODE_ENV=production
RUN npm run build

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app

# DevSecOps: non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
# Force port 3000 — do NOT allow Coolify to override this via its env vars
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check — always port 3000 (matches EXPOSE and CMD)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Explicitly pass --port to node server to override any parent-scope PORT injection
CMD ["node", "--max-old-space-size=512", "server.js", "--port", "3000"]
