# Requirements Document

## Introduction

This document defines requirements for improving the Frontend and Backend of the Berijalan Employee Loyalty Program Portal to adhere to best practices, maintainability, and consistency with the AGENTS.md guidelines. The improvements focus on code quality, type safety, separation of concerns, and proper architectural patterns.

## Glossary

- **System**: The Berijalan Employee Loyalty Program Portal (Next.js Frontend + Express Backend)
- **Backend**: Express.js REST API server with Prisma ORM
- **Frontend**: Next.js application with App Router
- **LoyaltyEngine**: Domain service for token calculations, tier logic, and redemption eligibility
- **Repository**: Data access layer that abstracts Prisma queries
- **DTO**: Data Transfer Object for API responses

## Requirements

### Requirement 1: Eliminate Duplicate Tier Calculation Logic

**User Story:** As a developer, I want tier calculation logic to exist in a single location, so that maintenance is easier and bugs are prevented.

#### Acceptance Criteria

1. THE LoyaltyEngine SHALL be the single source of truth for tier thresholds and calculation logic
2. THE Backend SHALL remove duplicate TIER_THRESHOLDS and TIER_ORDER constants from loyalty.service.ts
3. THE Backend SHALL use LOYALTY_POLICIES from loyalty.policy.ts for all tier calculations
4. WHEN tier calculation is needed, THE Backend SHALL import from policies/loyalty.policy.ts only

### Requirement 2: Add Explicit Return Types to All Service Methods

**User Story:** As a developer, I want all service methods to have explicit return types, so that TypeScript can catch type errors at compile time.

#### Acceptance Criteria

1. THE AuditService.log method SHALL have an explicit return type of `Promise<void>`
2. THE LoyaltyCalculationService methods SHALL have explicit return types matching their actual return values
3. THE RedemptionService methods SHALL have explicit return types
4. THE UploadProcessingService methods SHALL have explicit return types
5. WHEN ESLint runs, THE Backend SHALL produce zero warnings for missing return types

### Requirement 3: Unify Type Definitions Between Frontend and Backend

**User Story:** As a developer, I want shared type definitions between Frontend and Backend, so that API contracts are enforced at compile time.

#### Acceptance Criteria

1. THE Backend domain.types.ts SHALL use Prisma enum types for Role, Division, TierStatus
2. THE Frontend types/index.ts SHALL match Backend domain types exactly
3. WHEN a type changes in Backend, THE Frontend SHALL be updated to match
4. THE System SHALL use uppercase enum values (MITRA, TEAM_LEADER, HC_PM) consistently

### Requirement 4: Implement Repository Pattern for Data Access

**User Story:** As a developer, I want a repository layer to abstract database queries, so that services remain focused on business logic.

#### Acceptance Criteria

1. THE Backend SHALL create a repositories/ directory with UserRepository, RedemptionRepository, UploadRepository
2. THE Repository layer SHALL contain only Prisma query logic, no business rules
3. THE Service layer SHALL call Repository methods, not Prisma directly
4. WHILE processing uploads, THE UploadProcessingService SHALL use UploadRepository for all DB operations

### Requirement 5: Add Input Validation for All API Endpoints

**User Story:** As a developer, I want all API inputs validated with Zod schemas, so that invalid data is rejected before processing.

#### Acceptance Criteria

1. WHEN an endpoint receives a path parameter, THE Controller SHALL validate it with Zod
2. WHEN an endpoint receives a request body, THE Controller SHALL validate it with the appropriate schema
3. IF validation fails, THE Controller SHALL return 400 with detailed error messages
4. THE updateStatus endpoint SHALL validate requestId as a valid UUID

### Requirement 6: Remove Hardcoded Values from Frontend Components

**User Story:** As a developer, I want the Frontend to derive all values from API responses, so that the UI reflects actual data.

#### Acceptance Criteria

1. THE EmployeeDashboardClient SHALL remove hardcoded mock data fallbacks
2. WHEN data is null or undefined, THE Frontend SHALL display loading or empty states
3. THE Frontend SHALL remove hardcoded period dates (2025-12-16, 2026-06-15) and use API-provided values
4. THE TokenBalancePill component SHALL fetch real token balance from API

### Requirement 7: Implement Proper Error Handling with Custom Error Classes

**User Story:** As a developer, I want custom error classes for different error types, so that error handling is consistent and informative.

#### Acceptance Criteria

1. THE Backend SHALL create AppError, ValidationError, NotFoundError, UnauthorizedError classes
2. WHEN a service encounters an error, THE service SHALL throw the appropriate custom error
3. THE error-handler middleware SHALL differentiate error types and return appropriate status codes
4. WHEN a resource is not found, THE Controller SHALL throw NotFoundError

### Requirement 8: Add Missing Authorization Checks for Team Leader Endpoints

**User Story:** As a developer, I want team leaders to only see their own team members, so that data access is properly scoped.

#### Acceptance Criteria

1. WHEN a team leader requests team summary, THE Service SHALL verify the leader has a team
2. WHEN a team leader requests member details, THE Service SHALL verify the member belongs to the leader's team
3. IF the member does not belong to the leader's team, THE System SHALL return 403 Forbidden
4. THE getTeamMemberDetail endpoint SHALL enforce team membership validation

### Requirement 9: Remove ESLint Disable Comments and Fix Root Causes

**User Story:** As a developer, I want code to pass ESLint rules without disabling them, so that code quality standards are enforced.

#### Acceptance Criteria

1. THE Backend SHALL remove `/* eslint-disable @typescript-eslint/no-misused-promises */` from route files
2. THE Backend SHALL properly type RequestHandler with async signatures
3. THE Backend SHALL remove `/* eslint-disable @typescript-eslint/no-unnecessary-condition */` and handle null cases properly
4. THE Frontend SHALL remove `/* eslint-disable @typescript-eslint/no-explicit-any */` and use proper types

### Requirement 10: Add Period ID Validation for Token Ledger Entries

**User Story:** As a developer, I want token ledger entries to always have a valid period ID, so that audit trails are complete.

#### Acceptance Criteria

1. WHEN creating a TokenLedgerEntry for redemption, THE System SHALL use the active period ID
2. IF no active period exists, THE System SHALL throw an error instead of using empty string
3. THE issueTokensForPeriod method SHALL validate periodId is not empty
4. THE updateStatus method SHALL fetch active period before creating ledger entries

### Requirement 11: Implement Proper Loading and Error States

**User Story:** As a user, I want clear loading and error states on all pages, so that I understand what is happening.

#### Acceptance Criteria

1. WHEN a page is loading data, THE Frontend SHALL display a skeleton or loading indicator
2. WHEN an API call fails, THE Frontend SHALL display an error message with retry option
3. THE EmployeeDashboardContent SHALL handle null data gracefully
4. THE Frontend SHALL use React Suspense boundaries for async components

### Requirement 12: Add Audit Logging for All Mutation Operations

**User Story:** As an admin, I want all mutation operations logged, so that there is a complete audit trail.

#### Acceptance Criteria

1. WHEN a redemption is created, THE System SHALL log REDEMPTION_CREATED
2. WHEN tokens are issued, THE System SHALL log TOKENS_ISSUED with details
3. WHEN a redemption status changes, THE System SHALL log the transition with previous and new status
4. THE AuditService SHALL capture actor IP address when available
