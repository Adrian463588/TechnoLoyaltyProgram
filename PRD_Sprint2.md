# PRD.md — Berijalan Employee Loyalty Program Portal
> Product Requirements Document for AI Vibecoders & Engineers
> Document Version: 1.1 · Date: May 14, 2026 · Status: Draft
> Source: Backlog Grooming Project Challenge (May 11, 2026)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Roles & Personas](#3-user-roles--personas)
4. [System Architecture Context](#4-system-architecture-context)
5. [Core Data Models](#5-core-data-models)
6. [Business Logic Reference](#6-business-logic-reference)
7. [Functional Requirements](#7-functional-requirements)
8. [User Stories & Acceptance Criteria](#8-user-stories--acceptance-criteria)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Edge Cases & Guard Conditions](#10-edge-cases--guard-conditions)
11. [Open Questions & Blocked Items](#11-open-questions--blocked-items)
12. [Suggested Build Order](#12-suggested-build-order)
13. [AI Vibecoder Quick Reference](#13-ai-vibecoder-quick-reference)

---

## 1. Product Overview

### 1.1 What This Is

The **Berijalan Employee Loyalty Program Portal** is an internal web platform that rewards employees (*Mitra*) for taking extra shifts or completing additional projects. Contributions are converted into tokens, which accumulate in each employee's account and can be exchanged for physical rewards through an approval-based redemption workflow.

The platform replaces a manual, spreadsheet-driven process with a centralized digital system that is transparent, auditable, and requires minimal administrative intervention for routine operations.

### 1.2 The Problem Being Solved

| Pain Point | Who Feels It | Current Workaround |
|------------|-------------|-------------------|
| Token balances tracked in Excel — prone to error | Mitra, HC | Manual reconciliation |
| Employees unaware of their membership tier or expiry | Mitra | Wait for HC to email |
| Redemption approval is a back-and-forth WhatsApp thread | HC, Mitra | Spreadsheet + chat |
| No visibility into team-level loyalty progress | Team Lead | Manual report from HC |
| Token expiry causes disputes because nobody was reminded | Mitra | None |

### 1.3 Primary Objectives

1. **Recognize employee contributions** transparently through a token economy.
2. **Automate token calculation** — eliminate manual spreadsheet updates.
3. **Digitize the redemption workflow** end-to-end with clear status tracking.
4. **Give employees real-time visibility** into balance, tier, and eligibility.
5. **Reduce HC administrative load** by automating routine notifications and calculations.

### 1.4 Division Scope

The system serves two employee segments with different earning models:

| Division | Employee Type | Earning Unit | Evaluation Period |
|----------|--------------|--------------|-------------------|
| **Opcent & Tele** | Regular Partner (Mitra Reguler) | Slots taken | Annual (by Dec 15) |
| **Techno Center** | Freelance Partner (Mitra Freelance) | Projects completed | Every 6 months |

> **Critical Rule for Coders:** Never mix Opcent/Tele slot logic with Techno project logic. These must be isolated calculation modules with a shared interface. Use a strategy pattern or division-specific service classes.

---

## 2. Goals & Success Metrics

### Business Outcomes

| Goal | Target | How Measured |
|------|--------|-------------|
| Replace manual Excel token tracking | 100% elimination by launch | Zero HC-initiated manual ledger updates in month 2 |
| Reduce HC monthly processing time | ≥ 70% reduction | Time-to-complete monthly cycle before vs. after |
| Zero ledger discrepancies | 0 disputes caused by system error | Audit log comparison |
| Employee self-service token queries | Reduce HC token inquiries by 80% | Support ticket count |

### Product Metrics (Instrument from Day 1)

- Percentage of active Mitra who log in at least once per month
- Percentage who view token balance or tier on first session
- Redemption request-to-completion cycle time
- Upload error rate per monthly cycle
- Token expiry notification open rate (if email/push enabled)

---

## 3. User Roles & Personas

### Role Matrix

| Capability | Mitra | Team Lead | HC / Admin |
|-----------|-------|-----------|-----------|
| View own token balance | ✅ | — | ✅ |
| View own token history | ✅ | — | ✅ |
| View own membership tier | ✅ | — | ✅ |
| Browse reward catalog | ✅ | — | ✅ |
| Submit redemption request | ✅ | — | — |
| View team token summaries | — | ✅ | ✅ |
| Validate shift / project claims | — | ✅ | ✅ |
| Approve / reject redemption | — | — | ✅ |
| Manual token adjustment | — | — | ✅ |
| Manage reward catalog | — | — | ✅ |
| Configure token rules / expiry | — | — | ✅ |
| Confirm active / resign status | — | — | ✅ |
| View audit log | — | — | ✅ |

### Persona 1 — Mitra (Employee)

**Who:** Operational employees in Opcent, Tele, or Techno divisions who take extra shifts or projects.

**First session goal:** Understand in under 30 seconds — *How many tokens do I have? What tier am I? Can I redeem now?*

**Key anxieties:**
- "Will my tokens expire without me knowing?"
- "Was my last shift counted correctly?"
- "Why was my redemption rejected?"

### Persona 2 — HC / Admin

**Who:** Human Capital People Management analyst who runs monthly operations.

**Primary workflow:** Receive data → validate → run calculations → manage redemptions → update statuses.

**Key anxieties:**
- "Did the file upload correctly?"
- "Did someone get their tokens when they shouldn't have?"
- "How do I know if a downgrade happened and why?"

### Persona 3 — Team Lead

**Who:** Supervisor who monitors their team's loyalty standing and eligibility.

**Primary need:** See which team members are close to a tier upgrade or at risk of downgrade — without asking HC.

---

## 4. System Architecture Context

> For AI vibecoders: use this as the guardrail when generating file structure, service names, and route groupings.

### Monorepo Directory Structure

```
LoyaltyProgram/
├── Backend/                        ← Backend (Express.js + Prisma)
│   ├── src/
│   │   ├── api/                    ← Route definitions
│   │   ├── controllers/            ← Request handlers
│   │   ├── services/               ← Business logic & orchestration
│   │   ├── repositories/           ← Data access (Prisma)
│   │   ├── policies/               ← Authorization & business rules
│   │   ├── db/                     ← Prisma client singleton
│   │   ├── errors/                 ← Custom error classes
│   │   ├── middleware/             ← Express middlewares (auth, validation)
│   │   ├── types/                  ← Shared domain types
│   │   ├── utils/                  ← Shared utility functions
│   │   └── app.ts                  ← Application entry point
│   ├── prisma/                     ← Database schema & migrations
│   ├── prisma.config.ts            ← Prisma adapter configuration
│   ├── tsconfig.json
│   └── package.json
│
├── Frontend/                       ← Frontend (Next.js App Router)
│   ├── src/
│   │   ├── app/                    ← Next.js Routing & Layouts
│   │   ├── components/             ← UI components (ui, shared, dashboard, rewards)
│   │   ├── features/               ← Domain-scoped client logic
│   │   ├── hooks/                  ← Custom React hooks
│   │   ├── lib/                    ← Shared utilities & configurations
│   │   ├── styles/                 ← Global CSS & Tailwind styles
│   │   ├── types/                  ← Frontend-specific types
│   │   ├── test/                   ← Frontend unit tests
│   │   └── middleware.ts           ← Route protection & role guards
│   ├── public/                     ← Static assets
│   ├── tsconfig.json
│   └── package.json
│
├── TestSuite/                      ← TestSuite (Cypress E2E + Vitest)
│   ├── cypress/                    ← Cypress E2E test files
│   │   ├── e2e/                    ← Test specifications
│   │   ├── support/                ← Custom commands & global setup
│   │   └── pages/                  ← Page Object Models (POM)
│   ├── fixtures/                   ← Test data (CSV, JSON)
│   ├── vitest/                     ← Vitest unit & integration tests
│   ├── cypress.config.ts           ← Cypress configuration
│   ├── vitest.config.ts            ← Vitest configuration
│   └── package.json
└── package.json
```

### Tech Stack (Required)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, latest stable) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | Prisma or Drizzle (pick one, stay consistent) |
| Styling | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| Auth | NextAuth / Auth.js |
| Tables | TanStack Table |
| Testing | Vitest (unit), Cypress (e2e) |
| Package Manager | pnpm |

---

## 5. Core Data Models

> These are semantic models. Map to Prisma/Drizzle schema. Do not skip fields marked **required for audit**.

### Enums

```typescript
type Division = 'OPCENT' | 'TELE' | 'TECHNO';

type MembershipTier = 'SAPHIRE' | 'EMERALD' | 'RUBY' | 'DIAMOND';

type PartnerStatus = 'ACTIVE' | 'INACTIVE' | 'RESIGNED';

type RedemptionStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'PURCHASED'
  | 'PICKUP_SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED';

type TokenEventType =
  | 'EARNED_SHIFT'
  | 'EARNED_PROJECT'
  | 'REDEEMED'
  | 'EXPIRED'
  | 'MANUAL_ADJUSTMENT'
  | 'DOWNGRADE_PENALTY'   // 50% cut
  | 'RESET_PENALTY';      // full reset to 0

type HealthBenefit = 'NONE' | 'FIT' | 'CLASSY';
```

### Core Entities

```typescript
// USER
interface User {
  id: string;
  email: string;                    // company email — login identifier
  name: string;
  division: Division;
  role: 'MITRA' | 'TEAM_LEAD' | 'HC_ADMIN';
  partnerStatus: PartnerStatus;
  membershipTier: MembershipTier;
  healthBenefit: HealthBenefit;
  teamLeadId?: string;              // FK to User (Team Lead)
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// TOKEN LEDGER (append-only — never update rows, only insert)
interface TokenLedger {
  id: string;
  userId: string;                   // FK User
  eventType: TokenEventType;
  amount: number;                   // positive = credit, negative = debit
  balanceAfter: number;             // snapshot of balance after this event
  referenceId?: string;             // FK to shift/project/redemption record
  earnedYear?: number;              // year tokens were earned (for expiry calc)
  expiresAt?: Date;                 // Dec 31 of (earnedYear + 3)
  reason?: string;                  // required for MANUAL_ADJUSTMENT, penalties
  performedBy: string;              // FK User (actor — Mitra self-report or HC)
  createdAt: Date;                  // ⚠️ Required for audit — never omit
}

// MEMBERSHIP HISTORY (append-only)
interface MembershipHistory {
  id: string;
  userId: string;
  previousTier: MembershipTier;
  newTier: MembershipTier;
  changeReason: 'UPGRADE' | 'DOWNGRADE' | 'RESET' | 'MANUAL';
  triggeredBy: string;              // FK User (actor)
  tokenBalanceBefore: number;
  tokenBalanceAfter: number;
  createdAt: Date;
}

// SHIFT / SLOT CLAIM (Opcent & Tele)
interface ShiftClaim {
  id: string;
  mitraId: string;
  slotCount: number;
  shiftDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  validatedBy?: string;             // FK User (HC or Team Lead)
  validatedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

// PROJECT CLAIM (Techno)
interface ProjectClaim {
  id: string;
  mitraId: string;
  projectName: string;
  completedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  validatedBy?: string;
  validatedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

// REWARD ITEM
interface RewardItem {
  id: string;
  name: string;
  description?: string;
  tokenCost: number;
  imageUrl?: string;
  isActive: boolean;
  stock?: number;                   // null = unlimited
  createdBy: string;               // FK User (HC)
  createdAt: Date;
  updatedAt: Date;
}

// REDEMPTION REQUEST
interface RedemptionRequest {
  id: string;
  mitraId: string;
  rewardItemId: string;
  tokenCost: number;               // snapshot at time of request
  status: RedemptionStatus;
  submittedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  pickupScheduledAt?: Date;
  completedAt?: Date;
  // Document verification
  idCardVerified: boolean;
  ktpVerified: boolean;
  npwpVerified: boolean;
  powerOfAttorneyRequired: boolean;
  powerOfAttorneyVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// REDEMPTION STATUS HISTORY (append-only)
interface RedemptionStatusHistory {
  id: string;
  redemptionRequestId: string;
  previousStatus: RedemptionStatus;
  newStatus: RedemptionStatus;
  changedBy: string;               // FK User
  note?: string;
  createdAt: Date;
}

// AUDIT LOG
interface AuditLog {
  id: string;
  actorId: string;                 // FK User
  action: string;                  // e.g. 'TOKEN_MANUAL_ADJUST', 'TIER_RESET'
  targetUserId?: string;
  targetEntityType?: string;       // 'RedemptionRequest', 'TokenLedger', etc.
  targetEntityId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
```

---

## 6. Business Logic Reference

> All rules in this section must live in `Backend/src/services/` or domain modules. **Never implement these inside UI components or API route handlers directly.**

### 6.1 Token-to-Slot Conversion

```
1 Slot = 1 Token
```

Used only for Opcent/Tele membership tier calculation. Tokens earned = slots accumulated.

### 6.2 Opcent & Tele — Membership Tier Rules

**Upgrade deadline:** December 15 of the current year.

| Tier | Slots Required (Annual) | Est. Time to Achieve | Health Benefit |
|------|------------------------|---------------------|----------------|
| Saphire | 0 (default) | Immediate | None |
| Emerald | 430 slots | ~1 year | FIT |
| Ruby | 860 slots | ~2 years | FIT |
| Diamond | 1,300 slots | ~3 years | CLASSY |

**Upgrade rule:** Cumulative slots in the current period must reach the threshold before December 15.

### 6.3 Opcent & Tele — Downgrade & Reset Rules

```
DOWNGRADE trigger:
  → Mitra does NOT take any slots for 3 consecutive months
  → Token penalty: current_balance × 0.50 (rounded down)
  → Tier drops one level

RESET trigger:
  → Mitra is completely unavailable (no slots taken) for 3 consecutive months
  → Token balance: set to 0
  → Tier: reset to SAPHIRE

Note: Clarify with stakeholders whether DOWNGRADE and RESET
are two distinct triggers or sequential. Current interpretation:
  - DOWNGRADE = inactive but still available (partial month participation)
  - RESET = fully unavailable / marked as unavailable for 3 months straight
```

**Implementation requirement:** These rules must be evaluated on a scheduled job (monthly), not triggered only on user action. Log every evaluation result — even when no change occurs — to the `AuditLog`.

### 6.4 Techno Center — Membership Tier Rules

**Evaluation period:** Every 6 months.

| Tier | Projects Required (per 6 months) | Health Benefit |
|------|----------------------------------|---------------|
| Saphire | 0 (default) | None |
| Emerald | 25 projects | FIT |
| Ruby | 50 projects | FIT |
| Diamond | 75 projects | CLASSY |

**Downgrade/Reset trigger:** Rejecting 3 or more projects within a 6-month evaluation window.

> ⚠️ **Open item:** Exact penalty percentage for Techno downgrade/reset not confirmed. See Section 11.

### 6.5 Token Expiry Rules

```
Token lifetime: 4 years, measured per December 31.

Expiry formula:
  tokens earned during Year N expire on December 31 of Year (N+3)

Example:
  Tokens earned Jan–Dec 2023 → expire December 31, 2026
  Tokens earned Jan–Dec 2024 → expire December 31, 2027
```

**Implementation requirement:**
- Store `earnedYear` on every `TokenLedger` credit entry.
- Run a nightly or monthly expiry job: query all unexpired tokens where `expiresAt <= now()`, create a `EXPIRED` debit entry, update balance.
- Fire expiry reminder notifications at **90 days**, **30 days**, and **7 days** before expiry.

### 6.6 Redemption Eligibility — All Guards Must Pass

```typescript
// All conditions must be true for a redemption to proceed
function isEligibleToRedeem(user: User, tokenBalance: number, item: RewardItem): boolean {
  return (
    user.partnerStatus === 'ACTIVE'         // not resigned
    && tokenBalance >= item.tokenCost       // sufficient balance
    && item.isActive                        // item still available
    && isWithinRedemptionWindow()           // within valid redeem period
    && (item.stock === null || item.stock > 0) // stock available if limited
  );
}
```

**Rule:** Backend must re-validate all conditions at redemption submission time — client-side eligibility display is UX only and never trusted for authorization.

### 6.7 Document Requirements at Redemption Pickup

| Scenario | Required Documents |
|----------|--------------------|
| Mitra picks up personally | Partner ID Card, KTP (National ID), NPWP (Tax ID) |
| Authorized representative picks up | Partner ID Card, KTP, NPWP, Power of Attorney (stamped + signed) |

HC must mark all documents as verified before status can move to `COMPLETED`.

---

## 7. Functional Requirements

### AUTH — Authentication & Authorization

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REQ-AUTH-01 | Login with company email address | 🔴 Must | Primary auth method |
| REQ-AUTH-02 | Role-based UI routing post-login | 🔴 Must | Mitra, Team Lead, HC each see different shell |
| REQ-AUTH-03 | Forgot password / reset password flow | 🔴 Must | Email-based reset link |
| REQ-AUTH-04 | Single Sign-On (SSO) | 🟡 Optional | If internal IdP is available |

**Server enforcement rule:** Role checks must happen in server middleware and server actions — not only in client navigation guards.

---

### CORE FLOW — Token Lifecycle

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REQ-CF-01 | Mitra can log a shift/project claim | 🔴 Must | Opcent/Tele = slot count; Techno = project |
| REQ-CF-02 | HC or Team Lead validates/rejects claim | 🔴 Must | Status: PENDING → APPROVED / REJECTED |
| REQ-CF-03 | System auto-credits tokens on approval | 🔴 Must | Insert `TokenLedger` row; update balance |
| REQ-CF-04 | Tokens accumulate across claims | 🔴 Must | Balance = sum of all ledger entries |
| REQ-CF-05 | Mitra can view reward catalog | 🔴 Must | Shows token cost + eligibility status |
| REQ-CF-06 | Mitra can submit redemption request | 🔴 Must | Blocked if ineligible |
| REQ-CF-07 | Redemption requires HC approval | 🔴 Must | Approval gate before token deduction |
| REQ-CF-08 | Approved redemption deducts tokens | 🔴 Must | Insert debit `TokenLedger` row |
| REQ-CF-09 | Expired tokens are zeroed automatically | 🔴 Must | Scheduled job; append debit row |

---

### MITRA — Employee Features

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REQ-MIT-01 | Display current token balance | 🔴 Must | Hero number on dashboard, above the fold |
| REQ-MIT-02 | Display full token history (earn + spend) | 🔴 Must | Paginated ledger view |
| REQ-MIT-03 | Submit reward redemption from catalog | 🔴 Must | With inline eligibility check |
| REQ-MIT-04 | Display expiry dates per token cohort | 🔴 Must | Group by earned year |
| REQ-MIT-05 | In-app notification: token expiring soon | 🔴 Must | 90d / 30d / 7d before expiry |
| REQ-MIT-06 | In-app reminder: take slots to avoid downgrade | 🟡 Optional | Proactive monthly nudge |
| REQ-MIT-07 | Display current membership tier | 🔴 Must | With tier badge + health benefit indicator |
| REQ-MIT-08 | Display tier progress (slots/projects to next tier) | 🔴 Must | Progress bar to next threshold |
| REQ-MIT-09 | AI reward recommendation | 🟢 Future | Based on balance, past redemptions, tier |

---

### HC ADMIN — Management Features

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REQ-HC-01 | Configure token rules per shift/project type | 🔴 Must | Editable, versioned, audit-logged |
| REQ-HC-02 | Manage reward catalog (add / edit / deactivate) | 🔴 Must | Including token cost and stock |
| REQ-HC-03 | Configure token expiry policy | 🔴 Must | Default: 4-year rolling per Dec 31 |
| REQ-HC-04 | Manual token adjustment (credit or debit) | 🔴 Must | Requires mandatory reason text; audit-logged |
| REQ-HC-05 | Confirm or update partner active/resign status | 🔴 Must | Triggers eligibility re-evaluation |
| REQ-HC-06 | Review token + membership summary per Mitra | 🔴 Must | For reporting and evaluation |
| REQ-HC-07 | Approve or reject redemption requests | 🔴 Must | With status tracking |
| REQ-HC-08 | Mark documents as verified on redemption pickup | 🔴 Must | ID Card, KTP, NPWP, Power of Attorney |
| REQ-HC-09 | Update redemption fulfillment status | 🔴 Must | Purchased → Pickup Scheduled → Completed |
| REQ-HC-10 | View audit log for all admin actions | 🔴 Must | Filterable by actor, action type, date |

---

### MEMBERSHIP ENGINE

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REQ-MEM-01 | Default tier is Saphire (0 slots/projects) | 🔴 Must | Auto-assigned at registration |
| REQ-MEM-02 | Opcent/Tele: Emerald at 430 cumulative slots | 🔴 Must | By December 15 |
| REQ-MEM-03 | Opcent/Tele: Ruby at 860 cumulative slots | 🔴 Must | By December 15 |
| REQ-MEM-04 | Opcent/Tele: Diamond at 1,300 cumulative slots | 🔴 Must | By December 15 |
| REQ-MEM-05 | 1 slot = 1 token conversion | 🔴 Must | Used for Opcent/Tele tier calculation only |
| REQ-MEM-06 | Health benefit assigned per tier | 🔴 Must | See benefit table in Section 6.2 |
| REQ-MEM-07 | Downgrade: 3 consecutive inactive months | 🔴 Must | Opcent/Tele |
| REQ-MEM-08 | Downgrade penalty: 50% token reduction | 🔴 Must | Logged as `DOWNGRADE_PENALTY` ledger event |
| REQ-MEM-09 | Reset: tier → Saphire, balance → 0 | 🔴 Must | Logged as `RESET_PENALTY` ledger event |
| REQ-MEM-10 | Techno: Emerald at 25 projects / 6 months | 🔴 Must | |
| REQ-MEM-11 | Techno: Ruby at 50 projects / 6 months | 🔴 Must | |
| REQ-MEM-12 | Techno: Diamond at 75 projects / 6 months | 🔴 Must | |
| REQ-MEM-13 | Techno: downgrade/reset on 3 project rejections in 6 months | 🔴 Must | Penalty % pending — see Section 11 |
| REQ-MEM-14 | Token expiry: 4-year lifecycle per Dec 31 | 🔴 Must | Nightly expiry job |
| REQ-MEM-15 | Membership history recorded on every change | 🔴 Must | Append-only |

---

### DOCUMENT VERIFICATION

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REQ-DOC-01 | Collect Partner ID Card, KTP, NPWP at pickup | 🔴 Must | HC marks each as verified |
| REQ-DOC-02 | Require Power of Attorney if representative picks up | 🔴 Must | With stamp + signature |
| REQ-DOC-03 | Redemption cannot reach COMPLETED without all docs verified | 🔴 Must | System guard on status transition |

---

## 8. User Stories & Acceptance Criteria

### US-01: Employee Views Loyalty Standing

**As a** Mitra,
**I want to** see my total tokens, current tier, and redemption eligibility immediately after login,
**so that** I understand my loyalty standing without asking anyone.

**Acceptance Criteria:**

- [ ] Dashboard loads within 2 seconds after authentication.
- [ ] Total token count is displayed in a hero element, using monospace font, above the fold.
- [ ] Membership tier is shown with a labeled tier badge (Saphire / Emerald / Ruby / Diamond).
- [ ] Redemption eligibility shows "You can redeem" (green) or "Not eligible — [reason]" (muted) clearly.
- [ ] Skeleton screen is shown while data loads — no spinners, no blank state.
- [ ] All three key data points (tokens, tier, eligibility) are visible without scrolling on desktop.

---

### US-02: Employee Submits Shift Claim

**As a** Mitra in Opcent/Tele,
**I want to** log a shift I've taken,
**so that** it gets validated and my tokens are credited automatically.

**Acceptance Criteria:**

- [ ] Mitra can select date, shift type, and slot count from a form.
- [ ] Form validates: date must be in current earning period; slot count must be positive integer.
- [ ] Submitted claim appears in "Pending" state immediately after submission.
- [ ] HC or Team Lead can see the pending claim in their validation queue.
- [ ] On approval, a `TokenLedger` credit entry is created instantly.
- [ ] Mitra receives an in-app notification: "Your shift claim was approved. +[X] tokens added."
- [ ] On rejection, Mitra sees the rejection reason provided by the validator.

---

### US-03: Employee Redeems a Reward

**As a** Mitra,
**I want to** select a reward and submit a redemption request,
**so that** HC can process it and I can receive the item.

**Acceptance Criteria:**

- [ ] Reward catalog shows token cost, item description, and current availability.
- [ ] Items the employee cannot afford show token cost in muted color with "Insufficient tokens" label.
- [ ] Inactive or out-of-stock items are hidden or clearly marked as unavailable.
- [ ] Submitting a redemption request creates a `RedemptionRequest` record in `DRAFT` → `PENDING_VERIFICATION`.
- [ ] System re-validates eligibility server-side at submission — client display is not trusted.
- [ ] Submission is blocked if: user is resigned, tokens are insufficient, item is inactive, outside redemption window.
- [ ] Mitra receives an in-app notification confirming submission with request ID.

---

### US-04: HC Approves a Redemption

**As an** HC Admin,
**I want to** verify a redemption request and track it to completion,
**so that** the employee receives their reward and the record is auditable.

**Acceptance Criteria:**

- [ ] Redemption queue shows all pending requests with Mitra name, item, token cost, and submission date.
- [ ] HC can view the Mitra's current token balance and partner status before approving.
- [ ] Approving moves status from `PENDING_VERIFICATION` to `VERIFIED`; tokens are debited.
- [ ] Rejecting requires a mandatory reason field; moves status to `REJECTED`.
- [ ] HC can mark documents verified (ID Card, KTP, NPWP, Power of Attorney if applicable).
- [ ] Status can progress: `VERIFIED` → `PURCHASED` → `PICKUP_SCHEDULED` → `COMPLETED`.
- [ ] `COMPLETED` status requires all required documents to be marked verified.
- [ ] Every status change is recorded in `RedemptionStatusHistory` with actor and timestamp.

---

### US-05: Token Expiry Notification

**As a** Mitra,
**I want to** receive a warning before my tokens expire,
**so that** I can redeem them before they are lost.

**Acceptance Criteria:**

- [ ] System runs a daily check for tokens expiring within 90, 30, and 7 days.
- [ ] In-app notification is created at each threshold with tokens-at-risk count and expiry date.
- [ ] Notification links directly to the reward catalog.
- [ ] Token expiry event creates a `EXPIRED` debit ledger entry — balance updated automatically.
- [ ] Expired tokens are shown in history as a separate line item with reason "Token expired (cohort YYYY)".

---

### US-06: HC Runs Manual Token Adjustment

**As an** HC Admin,
**I want to** manually add or remove tokens from a Mitra's account,
**so that** I can correct system errors or apply special policies.

**Acceptance Criteria:**

- [ ] Manual adjustment requires: amount (positive or negative), mandatory reason text (min 10 chars), and confirmation.
- [ ] Adjustment creates a `MANUAL_ADJUSTMENT` ledger entry with actor identity and reason.
- [ ] Adjustment is recorded in `AuditLog` with previous balance, new balance, and actor.
- [ ] Mitra receives an in-app notification: "Your token balance was adjusted by [+/-X]. Reason: [reason]."
- [ ] HC cannot adjust a resigned Mitra's balance without an additional override confirmation.

---

### US-07: Membership Downgrade Runs Automatically

**As the** system,
**I must** evaluate membership downgrade and reset conditions monthly,
**so that** tier rules are enforced consistently without manual HC intervention.

**Acceptance Criteria:**

- [ ] Scheduled job runs on the 1st of each month for all active Mitra.
- [ ] Job checks consecutive inactive months from `ShiftClaim` / `ProjectClaim` history.
- [ ] If downgrade condition is met: tier drops one level, token balance multiplied by 0.5 (floor), `DOWNGRADE_PENALTY` ledger entry created, `MembershipHistory` row appended.
- [ ] If reset condition is met: tier set to `SAPHIRE`, balance set to 0, `RESET_PENALTY` ledger entry created, `MembershipHistory` row appended.
- [ ] Both outcomes are logged to `AuditLog` with reason `'SCHEDULED_MEMBERSHIP_EVALUATION'`.
- [ ] Mitra receives an in-app notification explaining the change and reason.
- [ ] Job is idempotent — re-running for the same month must not double-apply penalties.

---

## 9. Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Dashboard initial load (logged-in user) | < 2 seconds (LCP) |
| Token balance query | < 200ms server response |
| Reward catalog load | < 1 second |
| Redemption submission | < 1 second end-to-end |
| Admin table (100 rows) render | < 1 second |

### Security

- All data-fetching must enforce role-based access at the server level.
- Sensitive personal data (name, email, KTP number) must never appear in client-side logs.
- All admin mutation endpoints must validate session and role server-side.
- File uploads (if any) must validate MIME type and content before processing.
- Manual token adjustments and tier changes must be logged with actor identity.

### Reliability

- Token ledger is append-only — no UPDATE or DELETE on ledger rows.
- Membership history is append-only.
- Redemption status history is append-only.
- All scheduled jobs (expiry, downgrade evaluation) must be idempotent.
- Calculation results must be deterministic: same input data + same rule version = same result.

### Usability

- Key metrics (tokens, tier, eligibility) must be above the fold for all viewport sizes.
- Error messages must explain what went wrong and what the user can do next.
- Validation errors on forms must appear at the field level, not only on submit.
- Loading states use skeleton screens — never blank white areas.

### Accessibility

- WCAG 2.1 AA minimum on all interactive elements.
- Status indicators must use text labels alongside color — color alone is never the only signal.
- All form inputs must have visible labels.
- Keyboard navigation must reach every action.
- Focus rings must be visible (2px solid accent color, 3px offset).

---

## 10. Edge Cases & Guard Conditions

> These are the scenarios where bugs hide. Implement guards for each.

| Scenario | Expected Behavior |
|----------|-------------------|
| Mitra submits redemption with exactly enough tokens | Allow; deduct exact amount |
| Mitra submits redemption with 0 token balance | Block at server; show "Insufficient tokens" |
| Mitra resigns mid-redemption (status: PENDING_VERIFICATION) | HC sees resignation flag; request moves to REJECTED with reason "Partner resigned" |
| Expiry job runs when Mitra has 0 balance | No ledger entry created; log skipped |
| HC runs manual adjustment resulting in negative balance | Block; return validation error "Balance cannot go below zero" |
| Downgrade job runs for a Mitra already at SAPHIRE | No tier change; no ledger penalty; log evaluation with "already at minimum tier" |
| Shift claim submitted outside earning period | Reject at form validation; return "Outside valid earning period" |
| Two HC admins approve the same redemption concurrently | Database-level lock or optimistic concurrency check; second approval returns "Already processed" |
| Mitra changes from Opcent to Techno division | Recalculate tier using Techno rules; flag account for HC review; log division change |
| Token expiry notification fires but Mitra has already redeemed those tokens | Notification skipped or shows "0 tokens expiring" — no false alarm |
| Tier upgrade evaluation runs on Dec 14 vs Dec 15 | Only Dec 15 (or scheduled Dec 15 job) is authoritative for upgrade evaluation |
| Repeat run of scheduled downgrade job in same month | Idempotency check: if evaluation already logged for this period, skip |

---

## 11. Open Questions & Blocked Items

> These require stakeholder answers before implementation. Do not invent policy.

| # | Question | Owner | Impact |
|---|----------|-------|--------|
| OQ-01 | What is the exact downgrade/reset penalty for Techno Freelance? Same 50%/0 as Opcent/Tele? | HC Lead | REQ-MEM-13, test fixtures |
| OQ-02 | What triggers DOWNGRADE vs RESET for Opcent/Tele? Are they mutually exclusive per evaluation cycle? | HC Lead | Scheduling logic, penalty calculation |
| OQ-03 | Is the redemption window a fixed calendar period or always open? | HC Lead | REQ-CF-06, eligibility guard |
| OQ-04 | Are reward stocks limited? If yes, is reservation (hold) needed at request submission? | HC Lead | RewardItem.stock field, concurrency |
| OQ-05 | What internal system is authoritative for partner active/resign status? API, manual HC update, or HR system sync? | IT / HC | REQ-HC-05, data freshness |
| OQ-06 | Should Team Leads have approval authority over shift claims, or view-only? | HC Lead | REQ-CF-02, role matrix |
| OQ-07 | Is the AI reward recommendation (REQ-MIT-09) in scope for Phase 1? | Product Owner | Phase planning |
| OQ-08 | What SLA governs each redemption status transition? (e.g., HC must verify within X days) | HC Lead | Notification scheduling |
| OQ-09 | Are health benefit tiers (FIT / CLASSY) managed inside this portal or in a separate HR system? | HR / IT | Integration scope |
| OQ-10 | Can a Mitra belong to both Opcent/Tele and Techno simultaneously? | HC Lead | Data model, tier calculation isolation |

---

## 12. Suggested Build Order

Follow this sequence to avoid implementing UI before business logic is proven.

```
Phase 1 — Foundation
├── 1. Auth: login, role routing, session management
├── 2. User model: Mitra, Team Lead, HC — with division and status
├── 3. Token ledger: append-only structure, balance computation
└── 4. Membership engine: tier rules, downgrade, reset (unit-tested before any UI)

Phase 2 — Core Employee Experience
├── 5. Shift/project claim submission and validation workflow
├── 6. Employee dashboard: tokens hero, tier badge, eligibility, progress bar
├── 7. Token history view (paginated ledger)
└── 8. Reward catalog (read-only first)

Phase 3 — Redemption Workflow
├── 9. Redemption request submission with server-side eligibility guard
├── 10. HC redemption queue: approve, reject, status transitions
├── 11. Document verification checklist on pickup
└── 12. Redemption history for Mitra

Phase 4 — Automation & Notifications
├── 13. Token expiry scheduled job + expiry ledger entries
├── 14. Downgrade/reset scheduled job (monthly)
├── 15. In-app notification system (expiry warnings, status updates)
└── 16. Manual token adjustment with audit log

Phase 5 — Admin & Leader Tools
├── 17. HC admin: token rule configuration
├── 18. HC admin: reward catalog management
├── 19. Team leader: team summary view
└── 20. Audit log viewer

Phase 6 — Enhancements (Post-MVP)
├── 21. Email / WhatsApp notification channels
├── 22. AI reward recommendation engine
├── 23. Configurable downgrade/reset rule UI
└── 24. Analytics and export tools
```

---

## 13. AI Vibecoder Quick Reference

Use these structured prompts when generating code for this system.

---

### Token Engine — Calculation Function

```
Generate a TypeScript function `calculateMembershipTier` in `Backend/src/services/membership.service.ts` (or appropriate domain module).

Rules:
- Input: { cumulativeSlots: number; evaluationDate: Date }
- Output: { tier: 'SAPHIRE' | 'EMERALD' | 'RUBY' | 'DIAMOND'; threshold: number; nextTier: string | null; slotsToNext: number | null }
- Thresholds: Saphire=0, Emerald=430, Ruby=860, Diamond=1300
- The evaluation deadline is December 15 of the current year
- Add JSDoc with examples
- Export a matching Zod schema for the input
- Include Vitest unit tests covering: boundary values (429, 430, 859, 860, 1299, 1300), zero slots, and above Diamond
```

---

### Scheduled Job — Downgrade Evaluation

```
Generate a cron-safe service function `runMonthlyMembershipEvaluation` in `Backend/src/services/evaluation.service.ts`.

Rules:
- Query all ACTIVE Mitra with division OPCENT or TELE
- For each, check ShiftClaim records: count consecutive months with zero claims
- If 3 consecutive months with no claims: apply DOWNGRADE (tier - 1, balance × 0.50)
- If 3 consecutive months fully unavailable: apply RESET (tier = SAPHIRE, balance = 0)
- Each outcome must:
  → Insert a TokenLedger row (DOWNGRADE_PENALTY or RESET_PENALTY event type)
  → Insert a MembershipHistory row
  → Insert an AuditLog row with reason 'SCHEDULED_MEMBERSHIP_EVALUATION'
- The function must be idempotent: check if evaluation for current month already exists before running
- Return a summary: { evaluated: number; downgraded: number; reset: number; skipped: number }
- Add Vitest tests for: already at SAPHIRE (no change), 2 months inactive (no change), 3 months inactive (downgrade), 3 months unavailable (reset), duplicate run (idempotent)
```

---

### Bento Dashboard — Employee Hero Section

```
Create a React server component `TokenHeroSection` in `Frontend/src/components/dashboard/TokenHeroSection.tsx`.

Design constraints (from DESIGN.md):
- Background: glass card (rgba(45,55,72,0.25), blur(16px), 1px rgba(255,255,255,0.10) border, 16px radius)
- Token count: JetBrains Mono font, 3rem, color #6BCE53
- Tier badge: colored chip (see tier config in DESIGN.md)
- Eligibility: green "Eligible" or muted "Ineligible — [reason]"
- isLoading prop: show skeleton screen when true (shimmer animation)
- Animate token count from 0 to value on mount using useCountUp hook

Props:
  { tokenBalance: number; tier: MembershipTier; eligibilityStatus: { eligible: boolean; reason?: string }; isLoading: boolean }

Include:
  - aria-label on token count: "[X] tokens"
  - role="status" on eligibility chip
  - Tailwind classes only (no inline styles)
```

---

### Redemption Guard — Server Action

```
Generate a Next.js server action `submitRedemptionRequest` in `Frontend/src/features/redemptions/actions.ts`.

Validation sequence (must run server-side, in this order):
1. Verify user session exists and role === 'MITRA'
2. Fetch RewardItem by id — confirm isActive === true
3. Check stock: if item.stock !== null, confirm stock > 0
4. Fetch user's current token balance from TokenLedger
5. Confirm balance >= item.tokenCost
6. Confirm user.partnerStatus === 'ACTIVE'
7. Confirm current date is within redemption window (open question — use isWithinRedemptionWindow() stub)
8. Insert RedemptionRequest record (status: PENDING_VERIFICATION)
9. Insert RedemptionStatusHistory (DRAFT → PENDING_VERIFICATION)
10. Create in-app notification for Mitra

Return type: { success: true; requestId: string } | { success: false; error: string; code: string }

Error codes: UNAUTHORIZED, ITEM_NOT_FOUND, ITEM_INACTIVE, OUT_OF_STOCK, INSUFFICIENT_TOKENS, PARTNER_NOT_ACTIVE, OUTSIDE_REDEMPTION_WINDOW

Add Zod input schema. Write Vitest tests for each failure path and the happy path.
```

---

### Append-Only Ledger Insert

```
Generate a repository function `appendTokenEvent` in `Backend/src/repositories/token-ledger.repository.ts`.

Rules:
- Input: { userId, eventType, amount, referenceId?, earnedYear?, reason?, performedBy }
- Fetch current balance before insert (SELECT FOR UPDATE to prevent race condition)
- Compute balanceAfter = currentBalance + amount
- Reject if balanceAfter < 0 (throw DomainError: 'BALANCE_CANNOT_GO_NEGATIVE')
- Insert TokenLedger row with balanceAfter snapshot
- Return the new ledger entry
- Use Prisma transaction to ensure atomicity
- Add JSDoc noting this function is the ONLY permitted way to modify token balance
```

---

*This document is the single source of product truth for the Berijalan Loyalty Portal. When business rules conflict with implementation convenience, the business rules win. When rules are ambiguous, surface the question — never invent policy.*

---

**End of PRD.md**
