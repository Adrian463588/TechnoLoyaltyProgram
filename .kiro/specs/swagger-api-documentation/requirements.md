# Requirements Document

## Introduction

This feature adds comprehensive Swagger/OpenAPI documentation to the Backend REST API for the Berijalan Employee Loyalty Program Portal. The documentation will cover all existing endpoints, request/response schemas, authentication requirements, and provide an interactive API explorer at `/api/docs`.

## Glossary

- **OpenAPI_Specification**: A standard format for describing REST APIs, formerly known as Swagger Specification
- **Swagger_UI**: An interactive documentation interface that visualizes OpenAPI specifications
- **swagger_jsdoc**: A library that generates OpenAPI specifications from JSDoc comments in source code
- **swagger_ui_express**: Express middleware to serve Swagger UI from an OpenAPI specification
- **JWT_Bearer_Auth**: Authentication scheme using JSON Web Tokens in the Authorization header
- **SessionUser**: The authenticated user object attached to Express requests after JWT verification
- **RoleType**: User roles in the system: MITRA, TEAM_LEADER, HC_PM
- **DivisionType**: Business divisions: OPTEL, TECHNO
- **RedemptionStatus**: Status values for reward redemption requests: DRAFT, PENDING_VERIFICATION, VERIFIED, REJECTED, PURCHASED, PICKUP_SCHEDULED, COMPLETED, CANCELLED
- **UploadStatus**: Status values for file uploads: STAGED, VALIDATING, PROCESSING, COMPLETED, FAILED

## Requirements

### Requirement 1: Install and Configure Swagger Dependencies

**User Story:** As a developer, I want to install and configure swagger-jsdoc and swagger-ui-express, so that the API can generate and serve OpenAPI documentation.

#### Acceptance Criteria

1. THE System SHALL have swagger-jsdoc package installed as a production dependency
2. THE System SHALL have swagger-ui-express package installed as a production dependency
3. THE System SHALL have @types/swagger-jsdoc and @types/swagger-ui-express installed as development dependencies
4. THE System SHALL have a Swagger configuration module that defines OpenAPI 3.0 specification metadata

### Requirement 2: Create API Documentation Infrastructure

**User Story:** As a developer, I want to create a centralized Swagger configuration, so that the API documentation is maintainable and follows DRY principles.

#### Acceptance Criteria

1. THE System SHALL create a dedicated Swagger configuration file at `src/config/swagger.config.ts`
2. THE Swagger_Config SHALL define OpenAPI 3.0.3 specification with basic API metadata (title, version, description, contact)
3. THE Swagger_Config SHALL define the JWT Bearer authentication security scheme
4. THE Swagger_Config SHALL define common response schemas for error responses
5. THE Swagger_Config SHALL define reusable components for request bodies and response schemas
6. THE System SHALL register the Swagger UI middleware at `/api/docs` endpoint in app.ts

### Requirement 3: Document Authentication Endpoints

**User Story:** As a developer, I want the Auth API endpoints documented, so that API consumers understand how to authenticate with the system.

#### Acceptance Criteria

1. WHEN a valid request is made to POST /api/auth/login, THE Swagger_Doc SHALL document the login request body schema with npk and password fields
2. WHEN a valid login request is documented, THE Swagger_Doc SHALL document the success response schema with user object
3. WHEN an invalid login request is documented, THE Swagger_Doc SHALL document the 400 validation error response
4. WHEN authentication fails, THE Swagger_Doc SHALL document the 401 unauthorized error response
5. WHEN a request is made to GET /api/auth/verify, THE Swagger_Doc SHALL document the endpoint requires Bearer token authentication
6. WHEN a valid token is provided to /api/auth/verify, THE Swagger_Doc SHALL document the success response with valid, userId, and role fields

### Requirement 4: Document Admin Redemption Endpoints

**User Story:** As a developer, I want the Admin Redemption API endpoints documented, so that HC PM users understand how to manage redemption requests.

#### Acceptance Criteria

1. WHEN a request is made to GET /api/admin/redemptions, THE Swagger_Doc SHALL document the endpoint requires HC_PM role authentication
2. WHEN a list of redemptions is returned, THE Swagger_Doc SHALL document the response schema as an array of redemption request objects with user and item relations
3. WHEN a request is made to GET /api/admin/redemptions/:id, THE Swagger_Doc SHALL document the id path parameter as a UUID format
4. WHEN a single redemption is returned, THE Swagger_Doc SHALL document the response schema includes status history
5. WHEN a request is made to POST /api/admin/redemptions/:id/status, THE Swagger_Doc SHALL document the request body schema with status and optional reason fields
6. WHEN a status update is documented, THE Swagger_Doc SHALL document the valid RedemptionStatus enum values
7. WHEN a status update succeeds, THE Swagger_Doc SHALL document the success response with message and updated request

### Requirement 5: Document Admin Upload Endpoints

**User Story:** As a developer, I want the Admin Upload API endpoints documented, so that HC PM users understand how to upload and process monthly data files.

#### Acceptance Criteria

1. WHEN a request is made to GET /api/admin/uploads, THE Swagger_Doc SHALL document the endpoint returns a list of upload records with batch summaries
2. WHEN a request is made to GET /api/admin/uploads/:id, THE Swagger_Doc SHALL document the response includes staging rows with validation issues
3. WHEN a request is made to POST /api/admin/uploads, THE Swagger_Doc SHALL document the multipart/form-data request with file and metadata fields
4. WHEN an upload request body is documented, THE Swagger_Doc SHALL document the file field accepts CSV or XLSX files up to 10MB
5. WHEN an upload request body is documented, THE Swagger_Doc SHALL document the divisionType field accepts OPTEL or TECHNO values
6. WHEN a file is staged successfully, THE Swagger_Doc SHALL document the response contains uploadId
7. WHEN a request is made to POST /api/admin/uploads/process, THE Swagger_Doc SHALL document the file preview/validate endpoint
8. WHEN a file is processed, THE Swagger_Doc SHALL document the response contains rows, issues, and summary
9. WHEN a request is made to POST /api/admin/uploads/:id/commit, THE Swagger_Doc SHALL document the commit endpoint requires a valid uploadId
10. WHEN a commit succeeds, THE Swagger_Doc SHALL document the response contains successCount and failureCount

### Requirement 6: Document Employee Endpoints

**User Story:** As a developer, I want the Employee API endpoints documented, so that MITRA users understand how to view their loyalty data and submit redemption requests.

#### Acceptance Criteria

1. WHEN a request is made to GET /api/employee/dashboard, THE Swagger_Doc SHALL document the endpoint requires authentication with MITRA, TEAM_LEADER, or HC_PM role
2. WHEN a dashboard response is documented, THE Swagger_Doc SHALL document the schema includes user info, tokenSummary, and recentRedemptions
3. WHEN a tokenSummary is documented, THE Swagger_Doc SHALL document all fields: totalTokens, remainingTokens, currentTier, pointsToNextTier, isEligibleForReward, activePeriod
4. WHEN a request is made to GET /api/employee/token-summary, THE Swagger_Doc SHALL document the endpoint returns TokenSummary schema
5. WHEN a request is made to GET /api/employee/redemptions, THE Swagger_Doc SHALL document the endpoint returns the current user's redemption history
6. WHEN a request is made to POST /api/employee/redemptions, THE Swagger_Doc SHALL document the request body schema with rewardItemId field
7. WHEN a redemption request succeeds, THE Swagger_Doc SHALL document the 201 response with created redemption object
8. WHEN insufficient tokens error is documented, THE Swagger_Doc SHALL document the 400 error response with validation details

### Requirement 7: Document Leader Endpoints

**User Story:** As a developer, I want the Team Leader API endpoints documented, so that TEAM_LEADER users understand how to monitor their team's progress.

#### Acceptance Criteria

1. WHEN a request is made to GET /api/leader/team, THE Swagger_Doc SHALL document the endpoint requires TEAM_LEADER or HC_PM role authentication
2. WHEN a team summary is returned, THE Swagger_Doc SHALL document the response as an array of TeamMemberSummary objects
3. WHEN a TeamMemberSummary is documented, THE Swagger_Doc SHALL document all fields: id, name, npk, division, tokens, tier, memberStatus
4. WHEN a leader has no team assigned, THE Swagger_Doc SHALL document the 403 Forbidden error response
5. WHEN a request is made to GET /api/leader/team/:memberId, THE Swagger_Doc SHALL document the memberId path parameter as UUID format
6. WHEN a team member detail is returned, THE Swagger_Doc SHALL document the response uses EmployeeDashboardData schema
7. WHEN a member is not in the leader's team, THE Swagger_Doc SHALL document the 403 Forbidden error response

### Requirement 8: Define Reusable Schema Components

**User Story:** As a developer, I want reusable schema components defined, so that the documentation follows DRY principles and is maintainable.

#### Acceptance Criteria

1. THE Swagger_Doc SHALL define a User schema component with id, npk, name, email, role, and divisionId fields
2. THE Swagger_Doc SHALL define a SessionUser schema component matching the authenticated request user type
3. THE Swagger_Doc SHALL define a TokenSummary schema component with all token and tier fields
4. THE Swagger_Doc SHALL define a RewardItem schema component with reward catalog fields
5. THE Swagger_Doc SHALL define a RedemptionRequest schema component with all redemption fields
6. THE Swagger_Doc SHALL define a MonthlyUpload schema component with upload status fields
7. THE Swagger_Doc SHALL define an ErrorResponse schema component for standard error responses
8. THE Swagger_Doc SHALL define a ValidationErrorResponse schema component for validation errors with details
9. THE Swagger_Doc SHALL define enum schemas for RoleType, DivisionType, RedemptionStatus, UploadStatus, MemberTierType

### Requirement 9: Configure Security Requirements

**User Story:** As a developer, I want security requirements documented for all endpoints, so that API consumers understand authentication requirements.

#### Acceptance Criteria

1. THE Swagger_Doc SHALL define a BearerAuth security scheme with type http and scheme bearer
2. WHEN documenting protected endpoints, THE Swagger_Doc SHALL apply the BearerAuth security requirement
3. THE Swagger_Doc SHALL document the 401 Unauthorized response for missing or invalid tokens
4. THE Swagger_Doc SHALL document role-based authorization requirements in endpoint descriptions
5. THE Swagger_Doc SHALL document the 403 Forbidden response for insufficient role permissions

### Requirement 10: Expose Interactive Documentation

**User Story:** As an API consumer, I want an interactive documentation UI, so that I can explore and test API endpoints directly in the browser.

#### Acceptance Criteria

1. THE System SHALL serve Swagger UI at the /api/docs endpoint
2. WHEN navigating to /api/docs, THE Swagger_UI SHALL display all documented endpoints organized by tags
3. THE Swagger_UI SHALL provide a "Try it out" feature for testing endpoints
4. THE Swagger_UI SHALL provide an Authorize button for entering Bearer tokens
5. THE Swagger_UI SHALL display request/response schemas for each endpoint
6. THE Swagger_UI SHALL display example values for request bodies and responses
7. THE System SHALL serve the OpenAPI JSON specification at /api/docs.json endpoint

### Requirement 11: Follow Clean Code and SOLID Principles

**User Story:** As a developer, I want the Swagger implementation to follow clean code practices, so that the codebase remains maintainable.

#### Acceptance Criteria

1. THE Swagger_Config SHALL follow Single Responsibility Principle by separating configuration from route documentation
2. THE Route_Documentation SHALL be placed in JSDoc comments directly above route handlers or in dedicated schema files
3. THE Schema_Components SHALL be defined in a separate file following DRY principles
4. THE Documentation_Code SHALL use TypeScript types to ensure type safety
5. THE Documentation_Code SHALL be organized by feature/domain module for maintainability
