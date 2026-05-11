# Loyalty Backend — REST API

Express.js REST API for the Berijalan Employee Loyalty Program Portal.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express 4 |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL via Prisma 7 |
| Auth | JWT (shared secret with Frontend NextAuth) |
| Testing | Vitest |
| Linting | ESLint 9 (typescript-eslint strict) |
| Deploy | GCP Cloud Run (`asia-southeast2`) |

## Directory Structure

```
Backend/
├── src/
│   ├── api/           ← Express routers (route definitions only)
│   ├── controllers/   ← Request handlers (parse → delegate → respond)
│   ├── services/      ← Business logic (domain-specific, testable)
│   ├── repositories/  ← Data access layer (Prisma queries)
│   ├── policies/      ← Authorization rule modules
│   ├── middleware/    ← authenticate, authorize, error-handler
│   ├── db/            ← Prisma client singleton
│   ├── utils/         ← File parsers, date helpers
│   └── types/         ← API types, domain enums, DTOs
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── Dockerfile
├── cloudbuild.yaml    ← GCP Cloud Build CI/CD
└── vitest.config.ts
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run migrations
npm run prisma:migrate

# 5. Seed database
npm run prisma:seed

# 6. Start dev server
npm run dev
```

## API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Health check |
| GET | `/api/auth/verify` | Auth | Verify token |
| GET | `/api/employee/dashboard` | MITRA+ | Employee dashboard |
| GET | `/api/employee/redemptions` | MITRA+ | My redemption history |
| POST | `/api/employee/redemptions` | MITRA+ | Submit redemption request |
| GET | `/api/admin/redemptions` | HC_PM | List all redemptions |
| POST | `/api/admin/redemptions/:id/status` | HC_PM | Update redemption status |
| GET | `/api/admin/uploads` | HC_PM | List uploads |
| POST | `/api/admin/uploads` | HC_PM | Stage file |
| POST | `/api/admin/uploads/process` | HC_PM | Preview/validate file |
| POST | `/api/admin/uploads/:id/commit` | HC_PM | Commit staged upload |
| GET | `/api/leader/team` | TEAM_LEADER+ | Team summary |

## Testing

```bash
npm run test:unit          # Run all unit tests
npm run test:unit:watch    # Watch mode
```

## Lint & Typecheck

```bash
npm run lint       # ESLint (strict TypeScript rules)
npm run typecheck  # tsc --noEmit
```

## GCP Deployment

```bash
# Build and deploy to Cloud Run
gcloud builds submit --config cloudbuild.yaml \
  --project=YOUR_PROJECT_ID

# Or manually
docker build -t loyalty-backend .
docker run -p 8080:8080 --env-file .env loyalty-backend
```
