# 🏆 Berijalan Employee Loyalty Program Portal

[![Stack: Next.js](https://img.shields.io/badge/Stack-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Stack: Express](https://img.shields.io/badge/Stack-Express%204-blue?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Stack: Prisma](https://img.shields.io/badge/Stack-Prisma%207-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![DB: PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%2014-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Testing: Cypress](https://img.shields.io/badge/Testing-Cypress-04C38E?style=for-the-badge&logo=cypress)](https://www.cypress.io/)
[![AI: RTK + Caveman](https://img.shields.io/badge/AI_Workflow-RTK_+_Caveman-orange?style=for-the-badge)](#-ai-agentic-workflow)

An enterprise-grade platform for managing employee loyalty programs across the **Optel** and **Techno** divisions.  
Employees (Mitra) earn tokens for extra shifts / projects and redeem them for rewards through a transparent, auditable system.

---

## 📑 Table of Contents

- [About The Project](#-about-the-project)
- [Architecture Overview](#️-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Step-by-Step: Getting Started](#-step-by-step-getting-started)
  - [1. Clone & Install](#1-clone--install)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Database Setup](#3-database-setup)
  - [4. Run the App (Local)](#4-run-the-app-local)
  - [5. Alternative: Docker Compose](#5-alternative-docker-compose)
- [Testing](#-testing)
- [Branch Strategy](#-branch-strategy)
- [AI Agentic Workflow](#-ai-agentic-workflow)
- [Architecture & Business Rules](#️-architecture--business-rules)
- [Data Templates](#-data-templates)
- [Documentation Reference](#-documentation-reference)
- [Security Policy](#-security-policy)

---

## 📖 About The Project

The **Berijalan Loyalty Program Portal** is a full-stack monorepo with three independent packages:

| Package | Tech | Purpose |
|---------|------|---------|
| `Frontend/` | Next.js 16 + NextAuth | Role-based UI (Mitra, HC, Team Leader) |
| `Backend/` | Express 4 + Prisma 7 | REST API, token engine, audit log |
| `TestSuite/` | Cypress + Vitest | E2E, integration, and unit tests |

**Key Features:**
- Role-Based Access Control: `MITRA`, `HC`, `TEAM_LEADER`
- Append-only `TokenLedger` for strict financial auditing
- Automated token expiry and division-specific calculation engines
- Light-first token-driven bento UI with optional dark mode and Framer Motion animations
- AI chatbot powered by Gemini (optional)
- Redis cache layer (optional for dev, enabled for prod)

---

## 🏗️ Architecture Overview

```
Browser
  └─► Next.js 16 (Frontend :3000)
        └─► NextAuth.js (session)
        └─► Express API (Backend :8081)
              └─► Prisma ORM
              └─► PostgreSQL :5432
              └─► Redis :6379 (optional)
```

```mermaid
graph TD
    A[Root Monorepo] --> B[Frontend — Next.js 16]
    A --> C[Backend — Express 4]
    A --> D[TestSuite — Cypress + Vitest]
    C --> E[(PostgreSQL)]
    C --> F[Prisma ORM]
    C --> G[Redis Cache]
    B --> H[NextAuth.js]
    B --> C
```

---

## ⚙️ Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | `≥ 20.x` | Use nvm or fnm for version management |
| npm | `≥ 10.x` | Bundled with Node 20 |
| PostgreSQL | `≥ 14` | Local install **or** Docker (see below) |
| Git | any | For cloning |
| Docker (optional) | `≥ 24` | For the Docker Compose path |

> **Windows users:** Use PowerShell or Git Bash. WSL2 also works.

---

## 🚀 Step-by-Step: Getting Started

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Adrian463588/TechnoLoyaltyProgram.git
cd TechnoLoyaltyProgram

# Install root workspace tooling (concurrently, etc.)
npm install

# Install each package's dependencies
cd Backend  && npm install && cd ..
cd Frontend && npm install && cd ..
cd TestSuite && npm install && cd ..
```

---

### 2. Environment Variables

Both Backend and Frontend need `.env` files. **Never commit real `.env` files.**

#### Backend (`Backend/.env`)

```bash
# Copy the example and fill in real values
cp Backend/.env.example Backend/.env
```

Edit `Backend/.env`:

```env
# Server
PORT=8081
NODE_ENV=development

# Database — replace with your local PostgreSQL credentials
DATABASE_URL="postgresql://loyalty_user:loyalty_pass@localhost:5432/loyalty_db"

# Auth — must match NEXTAUTH_SECRET in Frontend
NEXTAUTH_SECRET="your-super-secret-32-char-string-here"

# Frontend origin (CORS allow-list)
FRONTEND_ORIGIN="http://localhost:3000"

# Redis (optional for local dev — set REDIS_ENABLED=false to skip)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Chatbot (optional — set CHATBOT_ENABLED=false to skip)
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.0-flash"
CHATBOT_ENABLED=false
```

#### Frontend (`Frontend/.env.local`)

```bash
cp Frontend/.env.example Frontend/.env.local
```

Edit `Frontend/.env.local`:

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
NEXTAUTH_SECRET="your-super-secret-32-char-string-here"

# Backend URL — server-side (internal)
BACKEND_URL="http://localhost:8081/api"

# Backend URL — client-side (browser)
NEXT_PUBLIC_BACKEND_URL="http://localhost:8081/api"

# AI Chatbot (optional)
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.0-flash"
CHATBOT_ENABLED=false
```

> **Important:** `NEXTAUTH_SECRET` must be the **same value** in both files.

---

### 3. Database Setup

> **Option A — Local PostgreSQL**

Ensure PostgreSQL is running and create the database:

```sql
-- Run in psql or your DB client
CREATE USER loyalty_user WITH PASSWORD 'loyalty_pass';
CREATE DATABASE loyalty_db OWNER loyalty_user;
```

Then run migrations and seed:

```bash
# Generate Prisma client
npm run db:generate

# Apply migrations to the database
npm run db:migrate

# Seed with initial data (roles, admin user, sample rewards)
npm run db:seed
```

> **Option B — Docker PostgreSQL only**

```bash
docker run -d \
  --name loyalty-postgres \
  -e POSTGRES_USER=loyalty_user \
  -e POSTGRES_PASSWORD=loyalty_pass \
  -e POSTGRES_DB=loyalty_db \
  -p 5432:5432 \
  postgres:16-alpine

# Then run migrations from root
npm run db:migrate
npm run db:seed
```

---

### 4. Run the App (Local)

Start Backend and Frontend concurrently from the root:

```bash
npm run dev:all
```

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8081/api |
| **API Health** | http://localhost:8081/health or http://localhost:8081/api/health |

Or run each separately in different terminals:

```bash
# Terminal 1 — Backend
cd Backend && npm run dev

# Terminal 2 — Frontend
cd Frontend && npm run dev
```

**Default seed accounts:**

| Role | Login |
|------|-------|
| HC (Admin) | NPK `12345` + `DEMO_PASSWORD` |
| Team Leader | NPK `23456` + `DEMO_PASSWORD` |
| Mitra | NPK `34567` + `DEMO_PASSWORD` |

> Set `DEMO_PASSWORD` before running a development seed. Production seed uses
> the separately managed `SEED_ADMIN_PASSWORD` variable.

---

### 5. Alternative: Docker Compose

Run the full stack (Backend + Frontend + PostgreSQL + Redis) in containers:

```bash
# Start all services
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop all
docker compose down
```

Services will be available at the documented ports (`3000`, `8081`).

---

## 🧪 Testing

Run quality gates **before every push**:

| Command | Location | What it tests |
|---------|----------|---------------|
| `npm run test:backend` | Root | Backend unit + domain logic |
| `npm run test:frontend` | Root | Frontend component + hooks |
| `npm run lint` | Root | ESLint across all packages |
| `npm run typecheck` | Root | TypeScript strict check |
| `cd TestSuite && npx cypress open` | TestSuite/ | E2E browser automation |
| `cd TestSuite && npx cypress run` | TestSuite/ | E2E headless CI mode |

**Quality gate (must pass before merge to `main`):**

```bash
npm run lint
npm run typecheck
npm run test:backend
```

---

## 🌿 Branch Strategy

```
main              ← production-ready, protected
├── ADRIAN        ← merged ✅
├── ezra          ← merged ✅
├── resolve-pr9-conflicts  ← merged ✅
└── run-local-fullstack    ← merged ✅
```

**Workflow for new features:**

```bash
# 1. Branch from main
git checkout -b feat/your-feature-name

# 2. Make small, testable commits
git commit -m "feat(scope): what changed"

# 3. Lint + typecheck before pushing
npm run lint && npm run typecheck

# 4. Open PR → main
```

**Commit format** (Conventional Commits):

```
feat(scope): short description
fix(scope): short description
chore(scope): short description
docs(scope): short description
test(scope): short description
```

---

## 🤖 AI Agentic Workflow

All developers and AI coding agents **must** use RTK AI + Caveman mode to prevent token waste and context bloat.

### Rule 1: Use RTK for Terminal Commands

```bash
# ❌ BAD — floods AI context with raw output
npm run test:backend
git diff HEAD

# ✅ GOOD — compressed output for AI
rtk npm run test:backend
rtk git diff HEAD
```

### Rule 2: Caveman Mode for AI Interactions

When using Gemini, Copilot, Cursor, or Codex:

```
/caveman ultra
```

AI must:
- Respond concisely — no filler
- Show diffs, not full files
- Ask before making architectural decisions
- Use `TODO(OQ-...)` tags for unclear business policy

### Rule 3: Follow AGENTS.md

Read [`AGENTS.md`](AGENTS.md) before any code change. It defines:
- Severity levels (S0–S3)
- Architecture layers
- Non-negotiable business rules (append-only ledger, audit log, RBAC)
- Definition of Done

---

## 🏛️ Architecture & Business Rules

Non-negotiable rules — enforced at review:

1. **Append-Only Token Ledger**  
   `TokenLedger` rows are never `UPDATE`d or `DELETE`d.  
   Balance = `SUM(amount)` always.

2. **Server-Side RBAC**  
   Role checks happen in API middleware and services — never only in UI.

3. **Audit Logging Required**  
   Any mutation to tokens, membership, redemptions, or user status must produce an audit log entry.

4. **Thin Controllers**  
   Route handlers: parse + Zod-validate only. Business logic → `Service` → `Domain` layers.

5. **Zod for All Mutations**  
   All incoming request bodies are validated with Zod schemas before reaching the service layer.

Full rules: [`AGENTS.md`](AGENTS.md) | Design tokens: [`DESIGN.md`](DESIGN.md)

---

## 📊 Data Templates

The following template files are committed for upload testing and data reference:

| File | Division | Purpose |
|------|----------|---------|
| `SAMPLE.xlsx` | All | Sample upload file for HC testing |
| `TEMPLATE_OPCENT_FIX.xlsx` | Opcent/Tele | Official token upload template |
| `TEMPLATE LOYALTY PROGRAM - OPERATION TELEPHONY CENTER.csv` | Opcent/Tele | CSV variant |
| `Template Loyalty Techno.tsv` | Techno | TSV upload template |
| `Template Loyalty optel.tsv` | Optel | TSV upload template |

Use these files to test the HC upload flow in development.

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| [`PRD_Sprint_2_1_Loyalty_Program.md`](PRD_Sprint_2_1_Loyalty_Program.md) | Full product requirements |
| [`DESIGN.md`](DESIGN.md) | Design system, tokens, component specs |
| [`AGENTS.md`](AGENTS.md) | AI agent rules, architecture, Definition of Done |
| [`Sprint_2.2.md`](Sprint_2.2.md) | Next sprint planning |

---

## 🔒 Security Policy

- **Never commit `.env` files.** Only `.env.example` with placeholder values.
- **Never commit API keys, passwords, or service account JSON files.**
- The `.gitignore` is configured to block `.env*`, `gcp-sa-key.json`, `*.key`, `*.pem`, and other sensitive patterns.
- If you accidentally push a secret: revoke it immediately, then use `git filter-repo` or BFG to purge history.
- Report security issues privately — do not open public issues.

---

*Built with ❤️ for the Berijalan Team.*
