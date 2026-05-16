# Implementation Plan: Best Practices Improvements

## Overview

This implementation plan addresses code quality, type safety, architectural improvements, and best practices adherence for the Berijalan Employee Loyalty Program Portal. The work is organized into phases that build incrementally, starting with foundational infrastructure (errors, repositories) and progressing through service layer updates, controller validation, frontend improvements, and final cleanup.

## Tasks

- [ ] 1. Set up custom error classes infrastructure
  - [-] 1.1 Create errors/ directory structure and base AppError class
    - Create `Backend/src/errors/` directory
    - Create `app-error.ts` with abstract AppError class extending Error
    - Include statusCode, code properties and stack trace capture
    - _Requirements: 7.1_

  - [-] 1.2 Create ValidationError class
    - Create `validation-error.ts` extending AppError with 400 status code
    - Include optional details property for validation error context
    - _Requirements: 7.1, 7.3_

  - [-] 1.3 Create NotFoundError class
    - Create `not-found-error.ts` extending AppError with 404 status code
    - Accept resource name and optional identifier in constructor
    - _Requirements: 7.1, 7.4_

  - [-] 1.4 Create UnauthorizedError and ForbiddenError classes
    - Create `unauthorized-error.ts` with 401 status code
    - Create `forbidden-error.ts` with 403 status code
    - _Requirements: 7.1, 8.3_

  - [-] 1.5 Create errors/index.ts barrel export
    - Export all error classes from single entry point
    - _Requirements: 7.1_

- [ ] 2. Update error handler middleware for custom errors
  - [~] 2.1 Update error-handler.ts to handle custom error types
    - Import and handle ValidationError, NotFoundError, UnauthorizedError, ForbiddenError
    - Return appropriate HTTP status codes and JSON error responses
    - Include error code and details in response
    - _Requirements: 7.3_

  - [ ] 2.2 Write unit tests for error handler middleware
    - Test each error type returns correct status code and response format
    - Test unknown errors return 500 with generic message
    - _Requirements: 7.3_

- [ ] 3. Create repository layer for data access
  - [~] 3.1 Create UserRepository with core user queries
    - Create `repositories/user.repository.ts`
    - Implement findById, findByNpk, upsertByNpk, getLoyaltyProfile, getTeamMembers methods
    - Inject PrismaClient via constructor for testability
    - _Requirements: 4.1, 4.2_

  - [~] 3.2 Create RedemptionRepository for redemption data access
    - Create `repositories/redemption.repository.ts`
    - Implement findAll, findById, findByUserId, create methods
    - Include proper relations for user, item, and history
    - _Requirements: 4.1, 4.2_

  - [~] 3.3 Create UploadRepository for upload processing
    - Create `repositories/upload.repository.ts`
    - Implement findAll, findById, create methods for MonthlyUpload
    - _Requirements: 4.1, 4.2_

  - [~] 3.4 Create PeriodRepository for period validation
    - Create `repositories/period.repository.ts`
    - Implement findActive and findById methods
    - _Requirements: 4.1, 4.2, 10.1_

  - [ ] 3.5 Write unit tests for UserRepository
    - Test all methods with mocked Prisma client
    - Verify correct Prisma method calls and return values
    - _Requirements: 4.1_

  - [ ] 3.6 Write unit tests for PeriodRepository
    - Test findActive and findById with mocked Prisma
    - _Requirements: 4.1, 10.1_

- [ ] 4. Eliminate duplicate tier calculation logic
  - [~] 4.1 Remove duplicate TIER_THRESHOLDS from loyalty.service.ts
    - Delete local TIER_THRESHOLDS constant
    - Re-export from loyalty.policy.ts for backward compatibility
    - _Requirements: 1.2, 1.3_

  - [~] 4.2 Remove duplicate TIER_ORDER from loyalty.service.ts
    - Delete local TIER_ORDER constant
    - Re-export from loyalty.policy.ts for backward compatibility
    - _Requirements: 1.2, 1.3_

  - [~] 4.3 Update determineTier to use LOYALTY_POLICIES
    - Import LOYALTY_POLICIES from loyalty.policy.ts
    - Delegate tier calculation to LOYALTY_POLICIES.calculateTier
    - _Requirements: 1.1, 1.4_

  - [~] 4.4 Update tier helper functions to use centralized constants
    - Update getNextTier and getPointsToNextTier to use LOYALTY_POLICIES
    - _Requirements: 1.1, 1.4_

- [ ] 5. Add explicit return types to service methods
  - [~] 5.1 Add explicit return types to AuditService methods
    - Add `Promise<void>` return type to AuditService.log
    - _Requirements: 2.1_

  - [~] 5.2 Add explicit return types to LoyaltyCalculationService methods
    - Add return types to getTeamSummary, getTeamMemberDetail, getEmployeeDashboard
    - _Requirements: 2.2_

  - [~] 5.3 Add explicit return types to RedemptionService methods
    - Add return types to updateStatus, getRedemptions, createRedemption
    - _Requirements: 2.3_

  - [~] 5.4 Add explicit return types to UploadProcessingService methods
    - Add return types to stageFile, commitUpload, processValidRows
    - _Requirements: 2.4_

- [ ] 6. Add authorization checks for team leader endpoints
  - [~] 6.1 Update getTeamSummary to verify leader has team
    - Check leader.teamId exists, throw ForbiddenError if not
    - Use UserRepository for data access
    - _Requirements: 8.1_

  - [~] 6.2 Update getTeamMemberDetail to verify team membership
    - Verify leader has a team, throw ForbiddenError if not
    - Verify member belongs to leader's team, throw ForbiddenError if not
    - Throw NotFoundError if member does not exist
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ] 6.3 Write unit tests for authorization checks
    - Test leader without team returns 403 Forbidden
    - Test leader accessing other team member returns 403 Forbidden
    - Test non-existent member returns 404 Not Found
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 7. Add period ID validation for token ledger entries
  - [~] 7.1 Update RedemptionService.updateStatus to validate period
    - Fetch active period using PeriodRepository before creating ledger entry
    - Throw ValidationError if no active period exists
    - Use validated period.id instead of empty string
    - _Requirements: 10.1, 10.2, 10.4_

  - [~] 7.2 Update issueTokensForPeriod to validate periodId
    - Validate periodId is not empty before creating ledger entries
    - Throw ValidationError if periodId is empty or undefined
    - _Requirements: 10.3_

  - [ ] 7.3 Write unit tests for period ID validation
    - Test ledger entry creation fails gracefully without active period
    - Test error message is informative for missing period
    - _Requirements: 10.1, 10.2_

- [ ] 8. Add input validation for API endpoints
  - [ ] 8.1 Add UUID validation schema to validations.ts
    - Create uuidSchema using Zod for UUID validation
    - _Requirements: 5.1, 5.4_

  - [~] 8.2 Update redemption controller with Zod validation
    - Validate requestId path parameter with uuidSchema
    - Validate request body with updateStatusSchema
    - Throw ValidationError with details on validation failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [~] 8.3 Update upload controller with Zod validation
    - Validate uploadId path parameter with uuidSchema
    - Validate request body with appropriate schemas
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 8.4 Write unit tests for controller validation
    - Test invalid UUID returns 400 with validation error
    - Test invalid request body returns 400 with error details
    - _Requirements: 5.3, 5.4_

- [ ] 9. Unify type definitions between Frontend and Backend
  - [~] 9.1 Update Backend domain.types.ts to use Prisma enum types
    - Re-export RoleType, DivisionType, MemberTierType, RedemptionStatus from Prisma
    - Create type aliases for domain types (Role, Division, TierStatus)
    - _Requirements: 3.1_

  - [~] 9.2 Update Frontend types/index.ts to match Backend
    - Use SCREAMING_SNAKE_CASE enum values (MITRA, TEAM_LEADER, HC_PM)
    - Ensure TierStatus matches Backend values (BRONZE, SILVER, GOLD, PLATINUM)
    - Ensure RewardRequestStatus matches all Backend status values
    - _Requirements: 3.2, 3.4_

- [ ] 10. Remove hardcoded values from Frontend
  - [~] 10.1 Remove hardcoded period dates from components
    - Fetch period dates from API endpoint
    - Remove hardcoded dates (2025-12-16, 2026-06-15) from components
    - _Requirements: 6.3_

  - [~] 10.2 Remove mock data fallbacks from EmployeeDashboardClient
    - Display loading states when data is null or undefined
    - Remove hardcoded mock data fallbacks
    - _Requirements: 6.1, 6.2_

  - [~] 10.3 Update TokenBalancePill to fetch real token balance
    - Fetch token balance from API instead of hardcoded values
    - _Requirements: 6.4_

- [ ] 11. Implement proper loading and error states
  - [~] 11.1 Add loading skeletons to EmployeeDashboardContent
    - Display skeleton or loading indicator while data is loading
    - Handle null data gracefully
    - _Requirements: 11.1, 11.3_

  - [~] 11.2 Add error states with retry option
    - Display error message when API call fails
    - Provide retry button for failed requests
    - _Requirements: 11.2_

  - [~] 11.3 Add React Suspense boundaries for async components
    - Wrap async components with Suspense
    - Provide meaningful fallback UI
    - _Requirements: 11.4_

- [ ] 12. Add audit logging for mutation operations
  - [~] 12.1 Add audit logging for redemption creation
    - Log REDEMPTION_CREATED action with details
    - Capture actor ID and IP address
    - _Requirements: 12.1_

  - [~] 12.2 Add audit logging for token issuance
    - Log TOKENS_ISSUED with token amount and period
    - Include source upload ID in details
    - _Requirements: 12.2_

  - [~] 12.3 Add audit logging for redemption status changes
    - Log status transitions with previous and new status
    - Include reason if provided
    - _Requirements: 12.3_

  - [~] 12.4 Update AuditService to capture IP address
    - Accept optional ipAddress parameter
    - Store in audit log record
    - _Requirements: 12.4_

- [ ] 13. Remove ESLint disable comments and fix root causes
  - [~] 13.1 Remove eslint-disable @typescript-eslint/no-misused-promises from routes
    - Properly type RequestHandler with async signatures
    - Remove disable comments from route files
    - _Requirements: 9.1, 9.2_

  - [~] 13.2 Remove eslint-disable @typescript-eslint/no-unnecessary-condition
    - Handle null cases properly instead of disabling the rule
    - Add explicit null checks where needed
    - _Requirements: 9.3_

  - [~] 13.3 Remove eslint-disable @typescript-eslint/no-explicit-any from Frontend
    - Replace any with proper types
    - Use appropriate type definitions
    - _Requirements: 9.4_

- [~] 14. Checkpoint - Verify all changes pass linting and type checking
  - Run ESLint and verify zero warnings
  - Run TypeScript strict mode and verify zero errors
  - Ensure all tests pass

- [ ] 15. Final integration and verification
  - [~] 15.1 Run full test suite
    - Execute all unit tests
    - Execute integration tests
    - Verify all tests pass
    - _Requirements: 2.5_

  - [~] 15.2 Verify ESLint configuration produces zero warnings
    - Run ESLint across entire Backend
    - Run ESLint across entire Frontend
    - Address any remaining warnings
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [~] 15.3 Verify TypeScript strict mode compiles without errors
    - Run tsc --noEmit on Backend
    - Run tsc --noEmit on Frontend
    - Fix any type errors
    - _Requirements: 2.5_

  - [~] 15.4 Verify authorization enforcement
    - Test team leader cannot access other team's members
    - Test employee cannot access admin endpoints
    - _Requirements: 8.1, 8.2, 8.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Repository pattern enables easier testing and future database changes
- Custom error classes ensure consistent error handling across the application
- The design document uses TypeScript, so all implementation uses TypeScript

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "8.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2", "3.3", "3.4", "9.1", "9.2"] },
    { "id": 2, "tasks": ["2.2", "4.1", "4.2", "4.3", "4.4", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 3, "tasks": ["3.5", "3.6", "6.1", "6.2", "7.1", "7.2", "8.2", "8.3"] },
    { "id": 4, "tasks": ["6.3", "7.3", "8.4", "10.1", "10.2", "10.3"] },
    { "id": 5, "tasks": ["11.1", "11.2", "11.3", "12.1", "12.2", "12.3", "12.4"] },
    { "id": 6, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 7, "tasks": ["15.1", "15.2", "15.3", "15.4"] }
  ]
}
```
