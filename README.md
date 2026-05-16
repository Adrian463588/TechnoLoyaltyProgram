# 🏆 Berijalan Employee Loyalty Program Portal

[![Stack: Next.js](https://img.shields.io/badge/Stack-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Stack: Express](https://img.shields.io/badge/Stack-Express%204-blue?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Stack: Prisma](https://img.shields.io/badge/Stack-Prisma%207-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Testing: Cypress](https://img.shields.io/badge/Testing-Cypress-04C38E?style=for-the-badge&logo=cypress)](https://www.cypress.io/)
[![AI: RTK + Caveman](https://img.shields.io/badge/AI_Workflow-RTK_+_Caveman-orange?style=for-the-badge)](#-ai-agentic-workflow-mandatory)

An enterprise-grade platform for managing employee loyalty programs across the **Optel** and **Techno** divisions. This portal allows employees (Mitra) to earn tokens for their contributions (extra shifts, sprints, projects) and redeem them for rewards through a transparent, auditable system.

---

## 📑 Table of Contents
- [About The Project](#-about-the-project)
- [Architecture Overview](#%EF%B8%8F-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Installation](#1-installation)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Database Setup](#3-database-setup)
  - [4. Running the App](#4-running-the-app)
- [Testing](#-testing)
- [🤖 AI Agentic Workflow (MANDATORY)](#-ai-agentic-workflow-mandatory)
- [Architecture & Business Rules](#-architecture--business-rules)
- [Documentation Reference](#-documentation-reference)

---

## 📖 About The Project
The Berijalan Loyalty Program Portal is built as a **Monorepo**. It separates the Backend API, Frontend Client, and E2E Test Suite while maintaining shared development scripts at the root level. 

**Key Features:**
- Role-Based Access Control (Admin, HC, Team Leader, Mitra).
- Append-only Token Ledger for strict financial auditing.
- Automated token expiration and calculation engines specific to division rules.
- Modern Glassmorphism UI with Framer Motion animations.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    A[Root Monorepo] --> B[Frontend Next.js]
    A --> C[Backend Express.js]
    A --> D[TestSuite Cypress]
    C --> E[(PostgreSQL)]
    C --> F[Prisma ORM]
    B --> G[NextAuth.js]
```

---

## ⚙️ Prerequisites
Before you begin, ensure you have met the following requirements:
- **Node.js**: `v20.x` or higher.
- **npm**: `v10.x` or higher.
- **Database**: PostgreSQL (v14+ running locally or via Docker).
- **AI Tooling**: You **must** have [RTK AI](https://github.com/rtk-ai/rtk) and [Caveman](https://github.com/JuliusBrussee/caveman) installed if you are using AI coding assistants (Copilot, Cursor, Codex, Gemini). See the [AI Workflow section](#-ai-agentic-workflow-mandatory) below.

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies at the root level (this will install concurrently for workspace management):
```bash
git clone https://github.com/Adrian463588/TechnoLoyaltyProgram.git
cd TechnoLoyaltyProgram
npm install
```
Then, install dependencies for the sub-projects:
```bash
cd Backend && npm install
cd ../Frontend && npm install
cd ../TestSuite && npm install
cd ..
```

### 2. Environment Variables
You need to set up environment variables for both the Backend and Frontend.

**Backend (`Backend/.env`):**
Copy the example file and update the database URL.
```bash
cp Backend/.env.example Backend/.env
```
Ensure your `DATABASE_URL` is correct:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/loyalty_db"
JWT_SECRET="your-super-secret-jwt-key"
```

**Frontend (`Frontend/.env.local`):**
Copy the example file.
```bash
cp Frontend/.env.example Frontend/.env.local
```
```env
NEXTAUTH_SECRET="your-super-secret-nextauth-key"
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 3. Database Setup
Run the Prisma migrations to set up your PostgreSQL database schema:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Running the App
Start both the Backend and Frontend development servers concurrently from the root directory:
```bash
npm run dev:all
```
- **Frontend** will be available at: `http://localhost:3000`
- **Backend API** will be available at: `http://localhost:3001`

---

## 🧪 Testing

We enforce strict quality gates. Ensure tests pass before pushing changes.

| Test Type | Command (Run from Root) | Description |
| :--- | :--- | :--- |
| **Unit Tests (Backend)** | `npm run test:backend` | Tests domain logic and token engines. |
| **Unit Tests (Frontend)** | `npm run test:frontend` | Tests UI components and hooks. |
| **E2E Tests (Cypress)** | `cd TestSuite && npx cypress open` | Full browser automation testing. |

---

## 🤖 AI Agentic Workflow (MANDATORY)

To prevent context window bloat, save tokens, and ensure high-quality output, **all developers and AI agents operating in this repository MUST use RTK AI and Caveman Mode.**

### 1. ALWAYS Use RTK for Terminal Commands
Never run raw shell commands that output large logs (like `git diff`, `npm test`, `docker logs`) directly into the AI context. **Always prefix with `rtk`**:
```bash
# ❌ BAD (Wastes tokens, pollutes context)
npm run test:backend
git status

# ✅ GOOD (Compresses output for AI)
rtk npm run test:backend
rtk git status
```

### 2. ALWAYS Use Caveman Mode
When interacting with AI assistants (Codex, Gemini, Copilot, Cline), you must instruct the AI to use Caveman Mode. 
- Use the `/caveman ultra` trigger.
- AI must provide concise answers, no filler, and summarize logs instead of full-file rewrites.
- Read `.agent/` and `.kiro/steering/token-saving.md` for specific agent rules.

---

## 🏛️ Architecture & Business Rules

To maintain system integrity, adhere to these non-negotiable rules:
1. **Append-Only Token Ledger**: The `TokenLedger` table is append-only. **Never** write `UPDATE` or `DELETE` queries for token balances. Balance is always calculated via `SUM(amount)`.
2. **Server-Side RBAC**: Role checks must happen in the API middleware/services, not just by hiding UI elements on the Frontend.
3. **Audit Logging**: Any action that modifies balances, user tiers, or redemptions must trigger an audit log entry.
4. **Thin Controllers**: Route handlers should only parse requests and validate with Zod. All business logic belongs in the `Service` and `Domain` layers.

---

## 📚 Documentation Reference
For deeper context on requirements and design:
- [📖 Product Requirements Document (PRD)](PRD_Sprint_2_1_Loyalty_Program.md)
- [🎨 Design System & UI Specs](DESIGN.md)
- [🤖 Detailed Agent Rules](AGENTS.md)

---
*Built with ❤️ for the Berijalan Team.*
