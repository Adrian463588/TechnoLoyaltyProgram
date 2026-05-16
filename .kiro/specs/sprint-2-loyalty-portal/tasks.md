# Implementation Plan: Sprint 2 - Berijalan Employee Loyalty Program Portal

## Overview

Sprint 2 implements the core infrastructure including database schema alignment, authentication with role-based routing, token calculation engines for Opcent/Tele and Techno divisions, membership downgrade/reset logic, redemption workflows, and the initial frontend dashboard.

## Tasks

- [ ] 1. Database Schema Alignment
  - [x] 1.1 Define Prisma enums (DivisionType, MemberTierType, PartnershipStatus, TokenEventType, HealthBenefit)
    - Add enums to Backend/prisma/schema.prisma matching PRD Section 5
    - _Requirements: 1.2_
  
  - [x] 1.2 Create core entities (User, TokenLedger, MembershipHistory, ShiftClaim, ProjectClaim, RewardItem, RedemptionRequest, AuditLog)
    - Add entity definitions to schema.prisma with all required fields
    - _Requirements: 1.1_
  
  - [x] 1.3 Add database indexes for performance
    - Create indexes on TokenLedger(userId, createdAt), RedemptionRequest(mitraId, status), AuditLog(actorId, action)
    - _Requirements: 1.4_
  
  - [-] 1.4 Run Prisma migration
    - Execute `npx prisma migrate dev` to apply schema changes
    - _Requirements: 1.1_

- [ ] 2. Authentication & Authorization
  - [-] 2.1 Configure NextAuth with credentials provider
    - Create Backend/src/auth/config.ts with NextAuth options
    - Implement email/password authorization
    - _Requirements: 2.1, 2.2_
  
  - [-] 2.2 Implement role-based routing middleware
    - Update Frontend/src/middleware.ts to redirect unauthenticated users
    - Add role guards for /admin, /leader routes
    - _Requirements: 2.3, 2.4_
  
  - [ ] 2.3 Create role-based layout structure
    - Create src/app/(mitra)/, src/app/(leader)/, src/app/(admin)/ layout folders
    - Add role-specific navigation shells
    - _Requirements: 2.5_

- [ ] 3. Token Ledger Repository
  - [~] 3.1 Implement append-only TokenLedger repository
    - Create Backend/src/repositories/token-ledger.repository.ts
    - Implement creditTokens() and debitTokens() with atomic transactions
    - Implement getBalance() computing from ledger sum
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [~] 3.2 Write unit tests for TokenLedger repository
    - Test creditTokens creates positive entry
    - Test debitTokens creates negative entry
    - Test getBalance computes correctly
    - _Requirements: 3.5_

- [ ] 4. Token Calculation Engines
  - [~] 4.1 Create Opcent/Tele token engine
    - Create Backend/src/services/token-engine/opcent/engine.ts
    - Implement calculateTokens(), calculateTier(), getHealthBenefit(), isWithinEvaluationPeriod()
    - Use thresholds: EMERALD=430, RUBY=860, DIAMOND=1300
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [~] 4.2 Create Techno token engine
    - Create Backend/src/services/token-engine/techno/engine.ts
    - Implement calculateTokens(), calculateTier(), getHealthBenefit(), getCurrentPeriod()
    - Use thresholds: EMERALD=25, RUBY=50, DIAMOND=75
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [~] 4.3 Create token engine factory
    - Create Backend/src/services/token-engine/index.ts
    - Export getTokenEngine(division) to get correct engine
    - _Requirements: 4.5, 5.5_
  
  - [~] 4.4 Write unit tests for Opcent token engine
    - Test boundary values: 0, 429, 430, 860, 861, 1300, 1301
    - Test health benefit mapping
    - Test evaluation period logic
    - **Property 3: Opcent Tier Calculation** - validates Requirements 4.2
    - **Property 5: Opcent Slot-Token Conversion** - validates Requirements 4.1
    - **Property 11: Health Benefit Mapping** - validates Requirements 4.4
    - **Property 12: Opcent Evaluation Deadline** - validates Requirements 4.3
    - _Requirements: 4.2, 13.1_
  
  - [~] 4.5 Write unit tests for Techno token engine
    - Test boundary values: 0, 24, 25, 50, 51, 75, 76
    - Test health benefit mapping
    - Test period detection (P1/P2)
    - **Property 4: Techno Tier Calculation** - validates Requirements 5.2
    - **Property 6: Techno Project-Token Conversion** - validates Requirements 5.1
    - **Property 11: Health Benefit Mapping** - validates Requirements 5.4
    - _Requirements: 5.2, 13.2_

- [ ] 5. Membership Downgrade & Reset Logic
  - [~] 5.1 Implement membership downgrade service
    - Create Backend/src/services/membership/downgrade.service.ts
    - Implement evaluateDowngrade() with 3-month inactivity check
    - Apply 50% penalty (Math.floor(balance * 0.50))
    - Demote tier by one level
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [~] 5.2 Implement membership reset service
    - Create Backend/src/services/membership/reset.service.ts
    - Implement evaluateReset() with 3-month unavailable check
    - Set balance to 0, tier to SAPHIRE
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [~] 5.3 Create membership orchestration service
    - Create Backend/src/services/membership/membership.service.ts
    - Coordinate downgrade and reset evaluations
    - Ensure idempotent execution (track evaluation period)
    - _Requirements: 7.5_
  
  - [~] 5.4 Write unit tests for downgrade logic
    - Test 50% penalty calculation
    - Test tier demotion (DIAMOND→RUBY→EMERALD→SAPHIRE)
    - **Property 7: Downgrade Penalty Calculation** - validates Requirements 6.2
    - _Requirements: 6.2, 13.3_
  
  - [~] 5.5 Write unit tests for reset logic
    - Test zero balance after reset
    - Test tier reset to SAPHIRE
    - **Property 8: Reset Clears Balance** - validates Requirements 7.2
    - _Requirements: 7.2, 13.4_

- [ ] 6. Redemption Workflow
  - [~] 6.1 Implement redemption eligibility service
    - Create Backend/src/services/redemption/eligibility.service.ts
    - Check all five guards: partnerStatus, sufficient tokens, item active, stock available, redemption window
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [~] 6.2 Implement redemption service
    - Create Backend/src/services/redemption/redemption.service.ts
    - Implement submitRedemption(), approveRedemption(), rejectRedemption()
    - Handle status machine: DRAFT→PENDING_VERIFICATION→VERIFIED→PURCHASED→PICKUP_SCHEDULED→COMPLETED
    - _Requirements: 8.5, 8.6_
  
  - [~] 6.3 Create redemption server actions
    - Create Frontend/src/features/redemption/actions.ts
    - Implement submitRedemptionRequest() with server-side validation
    - Return error details for failed guards
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.7_
  
  - [~] 6.4 Implement manual token adjustment for HC Admin
    - Create Frontend/src/features/admin/actions.ts
    - Implement adjustTokenBalance() with role check, reason validation, audit logging
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [~] 6.5 Write unit tests for redemption eligibility
    - Test all five guard conditions
    - Test error detail returns
    - **Property 9: Redemption Eligibility Guards** - validates Requirements 8.1, 8.2, 8.3, 8.4, 8.7
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 13.5_
  
  - [~] 6.6 Write unit tests for manual adjustment
    - Test role validation
    - Test reason length validation
    - Test audit log creation
    - **Property 10: Manual Adjustment Audit Trail** - validates Requirements 9.4
    - _Requirements: 9.4, 13.5_

- [~] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Frontend Components
  - [~] 8.1 Create TokenHeroSection component
    - Create Frontend/src/components/dashboard/TokenHeroSection.tsx
    - Display balance, tier badge, eligibility status, progress bar
    - Use BentoGrid layout per DESIGN.md
    - Add loading skeleton
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [~] 8.2 Create ClaimForm component
    - Create Frontend/src/features/claims/components/ClaimForm.tsx
    - Support Opcent/Tele slot claims and Techno project claims
    - Use React Hook Form + Zod validation
    - Submit via server action
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [~] 8.3 Create RewardCatalog component
    - Create Frontend/src/features/rewards/components/RewardCatalog.tsx
    - Display active reward items with token cost
    - Indicate unaffordable items
    - _Requirements: 12.1, 12.2_
  
  - [~] 8.4 Create RedemptionApprovalQueue component
    - Create Frontend/src/features/admin/components/RedemptionApprovalQueue.tsx
    - Display pending redemptions with mitra name, item, cost
    - Support approve/reject actions
    - Add pagination and skeleton loading
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

- [ ] 9. Integration & End-to-End Tests
  - [~] 9.1 Write integration tests for redemption workflow
    - Test full flow: submit → approve → tokens deducted
    - Test rejection flow
    - _Requirements: 13.6_
  
  - [~] 9.2 Write E2E tests for Mitra flows
    - Test login and dashboard view
    - Test claim submission
    - Test redemption request
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [~] 9.3 Write E2E tests for HC Admin flows
    - Test manual token adjustment
    - Test redemption approval queue
    - _Requirements: 14.4, 14.5_

- [~] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Design uses TypeScript - implementation follows TypeScript patterns
- Append-only ledger pattern is critical - no UPDATE/DELETE on TokenLedger

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["3.2", "5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["4.4", "4.5", "5.4", "5.5", "6.1", "6.2"] },
    { "id": 5, "tasks": ["6.3", "6.4", "6.5", "6.6"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```