# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app

# DevSecOps: non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodeapp

COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeapp:nodejs /app/dist ./dist
COPY package.json ./

USER nodeapp
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Health check for Kubernetes probes
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
