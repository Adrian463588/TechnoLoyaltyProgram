# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --omit=dev && npx prisma generate

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --include=dev && npx prisma generate
COPY . .
RUN npm run build

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "--max-old-space-size=384", "dist/src/app.js"]
