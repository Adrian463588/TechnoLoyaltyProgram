# Loyalty Frontend — Next.js App

Next.js 16 App Router frontend for the Berijalan Employee Loyalty Program Portal.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Forms | React Hook Form + Zod |
| Auth | NextAuth v5 (Credentials) |
| State | Server-first; React state only when needed |
| Linting | ESLint 9 (eslint-config-next) |
| Deploy | GCP Cloud Run (`asia-southeast2`, standalone output) |

## Directory Structure

```
Frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/         ← Login page (public)
│   │   ├── (employee)/     ← Dashboard, rewards, history
│   │   ├── (leader)/       ← Team view
│   │   ├── (admin)/        ← Uploads, redemptions, audit
│   │   └── api/auth/       ← NextAuth handlers
│   ├── components/
│   │   ├── ui/             ← shadcn/ui primitives
│   │   ├── shared/         ← Cross-role reusable components
│   │   ├── bento/          ← Dashboard bento grid widgets
│   │   └── layout/         ← Navbar, sidebar
│   ├── features/           ← Domain feature modules (UI-side only)
│   ├── hooks/              ← Custom React hooks
│   ├── lib/
│   │   ├── api-client/     ← Type-safe HTTP client → Backend
│   │   ├── auth/           ← NextAuth configuration
│   │   └── db/             ← Prisma (NextAuth session only)
│   ├── middleware.ts        ← Next.js Edge route protection
│   ├── styles/             ← Global CSS
│   └── types/              ← Frontend-safe DTOs (no Prisma)
├── Dockerfile
├── cloudbuild.yaml          ← GCP Cloud Build CI/CD
└── next.config.ts
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set BACKEND_URL and NEXTAUTH_* values

# 3. Start dev server
npm run dev
```

## Key Rules

> **Frontend must NEVER import from `@prisma/client` or backend service files.**
> All data fetching goes through `src/lib/api-client/`.

## Lint & Typecheck

```bash
npm run lint       # ESLint (no-prisma-import rule enforced)
npm run typecheck  # tsc --noEmit
```

## GCP Deployment

```bash
# next.config.ts uses output: 'standalone' — compatible with Cloud Run
gcloud builds submit --config cloudbuild.yaml \
  --project=YOUR_PROJECT_ID
```
