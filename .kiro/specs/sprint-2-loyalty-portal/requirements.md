# Requirements Document - Sprint 2: Berijalan Employee Loyalty Program Portal

## Introduction

This document captures the requirements for Sprint 2 of the Berijalan Employee Loyalty Program Portal. Sprint 2 focuses on establishing the core data models, authentication with role-based access, token calculation engines, redemption workflows, and the initial frontend dashboard for Mitra users.

## Glossary

- **System**: The Berijalan Employee Loyalty Program Portal application
- **Backend**: The Express.js API server handling business logic and database operations
- **Frontend**: The Next.js App Router application serving the user interface
- **Mitra**: Employee role - the primary user who earns tokens and redeems rewards
- **Team Lead**: Supervisor role - can validate claims and view team summaries
- **HC Admin**: Human Capital Administrator role - full system access for management
- **TokenLedger**: Append-only financial ledger recording all token credits and debits
- **Division**: Employee segment (OPCENT/TELE for slots, TECHNO for projects)
- **MembershipTier**: Employee standing level (SAPHIRE, EMERALD, RUBY, DIAMOND)
- **PartnerStatus**: Employment status (ACTIVE, INACTIVE, RESIGNED)
- **RedemptionStatus**: State of reward request (DRAFT through COMPLETED)
- **Slot**: Work shift unit for Opcent/Tele divisions (1 slot = 1 token)
- **Project**: Completed project unit for Techno division
- **P1**: First earning period (December 16 → June 15)
- **P2**: Second earning period (June 16 → December 15)

## Requirements

### Requirement 1: Database Schema and Migrations

**User Story:** As a developer, I want the database schema to match the PRD data models so that the application has accurate entity definitions.

#### Acceptance Criteria

1. WHEN the development team runs Prisma migrations, THE System SHALL create all tables defined in PRD Section 5 including User, TokenLedger, MembershipHistory, ShiftClaim, ProjectClaim, RewardItem, RedemptionRequest, RedemptionStatusHistory, and AuditLog.
2. THE System SHALL define enums exactly as specified: Division, MembershipTier, PartnerStatus, RedemptionStatus, TokenEventType, HealthBenefit.
3. THE System SHALL enforce append-only behavior on TokenLedger - no UPDATE or DELETE operations permitted.
4. THE System SHALL create indexes on TokenLedger(userId, createdAt), RedemptionRequest(mitraId, status), AuditLog(actorId, action).

---

### Requirement 2: NextAuth Authentication with Role-Based Routing

**User Story:** As an employee, I want to log in with my company email and see only the interface appropriate to my role.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE System SHALL authenticate via NextAuth and create a session.
2. THE System SHALL assign roles MITRA, TEAM_LEAD, or HC_ADMIN from the user's record.
3. WHEN an unauthenticated user accesses a protected route, THE middleware SHALL redirect to /login.
4. WHEN an authenticated Mitra accesses an HC_ADMIN route, THE middleware SHALL redirect to their dashboard.
5. THE System SHALL provide role-specific layouts in src/app/(role)/layout.tsx that render different navigation and components.
6. THE System SHALL persist session tokens securely with HTTP-only cookies.

---

### Requirement 3: Token Ledger Repository with Atomic Transactions

**User Story:** As a system architect, I want the token ledger to be append-only with atomic balance updates so that financial integrity is maintained.

#### Acceptance Criteria

1. THE TokenLedgerRepository SHALL provide a creditTokens method that inserts a new TokenLedger row with positive amount.
2. THE TokenLedgerRepository SHALL provide a debitTokens method that inserts a new TokenLedger row with negative amount.
3. THE TokenLedgerRepository SHALL calculate balanceAfter as the sum of all amounts for the user plus the new entry in a single atomic transaction.
4. THE System SHALL NEVER execute UPDATE or DELETE on TokenLedger rows - only INSERT operations.
5. THE TokenLedgerRepository SHALL expose a getBalance(userId) method that computes current balance from the ledger.

---

### Requirement 4: Opcent/Tele Token Calculation Engine

**User Story:** As a Mitra in Opcent or Tele division, I want my slot claims converted to tokens so that my membership tier is calculated correctly.

#### Acceptance Criteria

1. THE OpcentTokenEngine SHALL calculate tokens earned as: tokens = slotCount (1:1 ratio).
2. THE OpcentTokenEngine SHALL apply tier thresholds: EMERALD at 430 slots, RUBY at 860 slots, DIAMOND at 1300 slots.
3. THE OpcentTokenEngine SHALL evaluate tier upgrades only during the annual period ending December 15.
4. THE OpcentTokenEngine SHALL determine health benefits: NONE for SAPHIRE, FIT for EMERALD/RUBY, CLASSY for DIAMOND.
5. THE System SHALL isolate Opcent logic in src/features/token-engine/opcent/ separate from Techno logic.

---

### Requirement 5: Techno Token Calculation Engine

**User Story:** As a Mitra in Techno division, I want my completed projects converted to tokens so that my membership tier reflects my work.

#### Acceptance Criteria

1. THE TechnoTokenEngine SHALL calculate tokens earned as: tokens = projectCount (1:1 ratio for tier calculation).
2. THE TechnoTokenEngine SHALL apply tier thresholds: EMERALD at 25 projects, RUBY at 50 projects, DIAMOND at 75 projects.
3. THE TechnoTokenEngine SHALL evaluate tiers every 6 months (P1 and P2 periods).
4. THE TechnoTokenEngine SHALL determine health benefits per the tier table.
5. THE System SHALL isolate Techno logic in src/features/token-engine/techno/ separate from Opcent logic.

---

### Requirement 6: Membership Downgrade Logic

**User Story:** As the system, I need to evaluate and apply membership downgrades automatically so that tier rules are enforced consistently.

#### Acceptance Criteria

1. THE MembershipService SHALL evaluate downgrade conditions monthly via a scheduled job.
2. WHEN a Mitra has no slots for 3 consecutive months, THE System SHALL apply a 50% token penalty (multiply balance by 0.50, floor result).
3. WHEN downgrade triggers, THE System SHALL create a DOWNGRADE_PENALTY TokenLedger entry with reason.
4. WHEN downgrade triggers, THE System SHALL change membershipTier to one level lower and create a MembershipHistory record.
5. THE System SHALL log all downgrade evaluations to AuditLog even when no change occurs.

---

### Requirement 7: Membership Reset Logic

**User Story:** As the system, I need to reset membership when a Mitra is fully unavailable so that the tier system reflects current engagement.

#### Acceptance Criteria

1. THE MembershipService SHALL evaluate reset conditions monthly.
2. WHEN a Mitra has no available slots for 3 consecutive months, THE System SHALL set token balance to 0.
3. WHEN reset triggers, THE System SHALL create a RESET_PENALTY TokenLedger entry.
4. WHEN reset triggers, THE System SHALL set membershipTier to SAPHIRE and create a MembershipHistory record.
5. THE System SHALL prevent duplicate application of downgrade/reset in the same evaluation period (idempotent job).

---

### Requirement 8: Redemption Request Server Action with Eligibility Guards

**User Story:** As a Mitra, I want to submit a redemption request that is validated server-side so that I cannot redeem tokens I don't have.

#### Acceptance Criteria

1. THE submitRedemptionRequest server action SHALL validate user.partnerStatus === 'ACTIVE' before processing.
2. THE submitRedemptionRequest SHALL verify currentBalance >= item.tokenCost - rejecting if insufficient.
3. THE submitRedemptionRequest SHALL verify item.isActive === true - rejecting if inactive.
4. THE submitRedemptionRequest SHALL verify item stock is available (stock === null OR stock > 0).
5. THE submitRedemptionRequest SHALL create a RedemptionRequest in DRAFT status transitioning to PENDING_VERIFICATION.
6. THE submitRedemptionRequest SHALL return error details for each failed guard condition.
7. THE System SHALL NOT trust client-side eligibility - all checks are repeated server-side.

---

### Requirement 9: Manual Token Adjustment Action for HC Admins

**User Story:** As an HC Admin, I want to manually adjust a Mitra's token balance with a recorded reason so that I can correct system errors.

#### Acceptance Criteria

1. THE adjustTokenBalance server action SHALL require actor to have HC_ADMIN role.
2. THE adjustTokenBalance SHALL require a reason string of minimum 10 characters.
3. THE adjustTokenBalance SHALL create a MANUAL_ADJUSTMENT TokenLedger entry with the reason and actorId.
4. THE adjustTokenBalance SHALL create an AuditLog entry with previousValue, newValue, and actorId.
5. THE adjustTokenBalance SHALL send an in-app notification to the Mitra about the adjustment.
6. THE adjustTokenBalance SHALL reject adjustments for RESIGNED partners unless override is confirmed.

---

### Requirement 10: TokenHeroSection for Mitra Dashboard

**User Story:** As a Mitra, I want to see my token balance, tier, and eligibility immediately after login so that I understand my standing.

#### Acceptance Criteria

1. THE TokenHeroSection component SHALL display the total token balance in a hero element above the fold.
2. THE TokenHeroSection SHALL display the current membership tier with a visual badge (SAPHIRE/EMERALD/RUBY/DIAMOND).
3. THE TokenHeroSection SHALL display redemption eligibility status with clear visual indication (green for eligible, muted for not).
4. THE TokenHeroSection SHALL use the BentoGrid layout per DESIGN.md requirements.
5. THE TokenHeroSection SHALL render a skeleton screen while data loads.
6. THE TokenHeroSection SHALL display tier progress showing tokens/slots to next threshold.

---

### Requirement 11: Shift/Project Claim Form

**User Story:** As a Mitra, I want to submit a claim for shifts I've taken or projects I've completed so that I can earn tokens.

#### Acceptance Criteria

1. THE ClaimForm component SHALL support Opcent/Tele slot claims with date and slotCount fields.
2. THE ClaimForm component SHALL support Techno project claims with projectName and completionDate fields.
3. THE ClaimForm SHALL validate using React Hook Form + Zod with proper error messages.
4. THE ClaimForm SHALL submit via a server action that creates a ShiftClaim or ProjectClaim in PENDING status.
5. THE ClaimForm SHALL display success notification after submission.
6. THE ClaimForm SHALL show validation errors inline for invalid fields.

---

### Requirement 12: Reward Catalog and Redemption Approval Queue

**User Story:** As an HC Admin, I want to view pending redemptions and manage the reward catalog so that I can process requests efficiently.

#### Acceptance Criteria

1. THE RewardCatalog component SHALL display all active reward items with tokenCost, name, and availability.
2. THE RewardCatalog SHALL indicate items the current user cannot afford.
3. THE RedemptionApprovalQueue SHALL display all PENDING_VERIFICATION requests with mitra name, item, token cost.
4. THE RedemptionApprovalQueue SHALL allow HC to approve (move to VERIFIED and deduct tokens) or reject (require reason).
5. THE RedemptionApprovalQueue SHALL use skeleton screens during loading.
6. THE RedemptionApprovalQueue SHALL support pagination for large result sets.

---

### Requirement 13: Unit Tests for Token Calculation Engines

**User Story:** As a developer, I want comprehensive unit tests for token calculation logic so that business rules are verified and don't regress.

#### Acceptance Criteria

1. THE token calculation tests SHALL cover boundary values: exactly 430 slots (Emerald threshold), exactly 429, exactly 860, exactly 1300.
2. THE token calculation tests SHALL cover Techno boundaries: exactly 25, 26, 50, 51, 75, 76 projects.
3. THE downgrade logic tests SHALL verify 50% penalty calculation and tier demotion.
4. THE reset logic tests SHALL verify zero balance and tier reset to SAPHIRE.
5. THE eligibility guard tests SHALL verify all five conditions are checked.
6. THE tests SHALL run in under 5 seconds using Vitest.

---

### Requirement 14: E2E Tests for Core User Flows

**User Story:** As a QA engineer, I want automated end-to-end tests for the primary user journeys so that critical paths are verified in the running system.

#### Acceptance Criteria

1. THE Cypress E2E tests SHALL cover the Mitra login and dashboard view flow.
2. THE E2E tests SHALL cover the shift/project claim submission flow.
3. THE E2E tests SHALL cover the redemption request submission and approval flow.
4. THE E2E tests SHALL cover the HC admin manual token adjustment flow.
5. THE E2E tests SHALL NOT mock the API - testing against the real running stack.
6. THE E2E tests SHALL use data-testid attributes for reliable element selection.