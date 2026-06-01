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

# Install curl for HEALTHCHECK — alpine curl is ~2MB, avoids shell escaping issues
# with inline node scripts and satisfies Coolify's curl/wget requirement
RUN apk add --no-cache curl

# DevSecOps: non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
# Force port 3000 — prevent Coolify env var injection from overriding
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check:
# --interval=30s  : check every 30 seconds after start period
# --timeout=10s   : fail attempt if no response within 10 seconds
# --start-period=60s : give Next.js 60s to cold-start before counting failures
# --retries=5     : 5 consecutive failures = unhealthy
# curl -f         : exit code 1 on HTTP 4xx/5xx (no redirect following by default)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

# Explicitly pass --port to node server to override any parent-scope PORT injection
CMD ["node", "--max-old-space-size=512", "server.js", "--port", "3000"]
