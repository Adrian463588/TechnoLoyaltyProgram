# Product Requirements Document (PRD)

## Project Overview

- **Project Name:** Berijalan Employee Loyalty Program Portal
- **Document Version:** 1.0
- **Date:** May 11, 2026
- **Product Type:** Internal web application
- **Platform:** Responsive web portal built with Next.js
- **Primary Language:** English
- **Document Owner:** Product / Business Analysis

## Purpose

The Berijalan Employee Loyalty Program Portal is a web-based loyalty management platform for employees in the Optel and Techno divisions. The product replaces manual spreadsheet-based tracking with a centralized system for token calculation, tier visibility, monthly administration, and reward redemption.

The portal is designed to improve transparency for employees, reduce manual work for Human Capital People Management (HC PM), and give team leaders better visibility into team progress and reward eligibility.

## Problem Statement

Today, loyalty data is maintained through manual Excel workflows, making token calculations slow, difficult to audit, and prone to inconsistency. Employees have limited visibility into how points are earned, whether their tier is changing, and when they are eligible to redeem rewards.

HC PM also carries a large operational burden each month, including file consolidation, rule validation, cut-off handling, downgrade or reset checks, and redemption administration. The organization needs a system that can standardize these workflows and make the loyalty program easier to understand and operate.

## Background and Business Context

The loyalty program operates across two business divisions with different earning inputs:

- **Optel:** loyalty earning is based on exclusive partner data and slot data.
- **Techno:** loyalty earning is based on sprint data and employee database records.

The system must support strict earning windows, cut-off snapshots, downgrade and reset rules, redeem-day validation, and multi-role workflows involving employees, HC PM, and team leaders.

## Product Goals

1. Digitize the full employee loyalty workflow in one portal.
2. Automate token calculation and tier determination for Optel and Techno.
3. Give employees real-time visibility into points, tier progress, and redemption eligibility.
4. Reduce monthly administrative effort for HC PM through upload-driven operations.
5. Provide team leaders with a clear team-level monitoring view.
6. Ensure reward redemption is controlled, auditable, and policy-compliant.

## Success Metrics

### Business Metrics

- 100% removal of manual Excel-based token calculation as the operational source of truth.
- At least 70% reduction in HC PM monthly processing time.
- 0 unresolved ledger discrepancies caused by inconsistent calculations or redemption validation errors.
- Reduced employee support questions about current points, tier, and reward eligibility.

### Product Metrics

- Percentage of active employees who log in at least once per month.
- Percentage of employees who view point growth or tier progress after login.
- Time needed by HC PM to complete a monthly upload cycle.
- Redemption request completion rate from request to fulfilled pickup.
- Error rate on file uploads, rule validation, and redeem-day eligibility checks.

## Scope

### In Scope

- Employee dashboard for points, tier, token age, remaining tokens, and reward eligibility.
- HC PM admin tools for monthly uploads, rule processing, snapshots, redemption management, and status updates.
- Team leader dashboard for team visibility.
- Division-specific token engine for Optel and Techno.
- Reward catalog and redemption workflow.
- Period management, cut-off logic, downgrade logic, and reset logic.
- Audit-friendly status history and operational logs.

### Out of Scope

- Payroll processing.
- Physical inventory procurement systems.
- Offline pickup verification digitization beyond status tracking.
- Public-facing marketing website.
- Native mobile apps in phase one.

## Users and Personas

### 1. Mitra (Employee)

**Who they are**  
Operational employees who participate in the loyalty program and want a simple way to understand their progress.

**Current behavior**  
They depend on manual updates or admin communication to know point status, reward eligibility, and loyalty standing.

**Needs**
- See total points and current tier clearly.
- Track whether points are increasing over time.
- Understand reward costs and eligibility.
- Submit redemption requests during valid periods.
- See whether any reset, downgrade, or inactive status affects them.

### 2. HC PM (Admin)

**Who they are**  
Internal administrators responsible for monthly operations, policy enforcement, and redemption fulfillment.

**Current behavior**  
They process data manually using spreadsheets, validate multiple input files, and coordinate redemption fulfillment across stakeholders.

**Needs**
- Upload monthly source data safely and quickly.
- Trigger or review automated calculations.
- Monitor cut-off periods and snapshots.
- Validate resign or active partnership status before redemption.
- Update redemption fulfillment statuses in an auditable flow.

### 3. Team Leader / Lead

**Who they are**  
Supervisors who need visibility into the progress and eligibility of their team members.

**Current behavior**  
They rely on indirect updates and fragmented files.

**Needs**
- View team point summaries.
- Identify employees approaching rewards or tier changes.
- Support motivation and communication using reliable data.

## User Research Inputs

The available discovery answers suggest that the portal should optimize for practical first-use clarity and habit-forming visibility:

- Users are likely to value checking total points and current tier immediately.
- Core must-have capabilities include auto point calculation, reward catalog access, team leader visibility, monthly data upload, and status reset handling.
- The strongest value proposition is reducing manual work, clarifying point rules, and speeding up reward checks.
- Repeat usage is driven by seeing points grow, claiming new rewards, checking team status, and tracking tier progress.

These inputs should shape the initial product experience, dashboard hierarchy, and success instrumentation.

## First-Time User Job

The single most important task a worker should complete in their first session is:

**Understand their current loyalty standing by seeing total points, current tier, and reward eligibility in one place.**

The first session should remove uncertainty and answer three questions quickly:

1. How many tokens do I have?
2. What tier am I currently in?
3. Can I redeem a reward now, or what do I need to reach the next milestone?

## Core Product Principles

- **Clarity first:** the system should make point rules and eligibility easy to understand.
- **Automation over manual handling:** calculations and validations should be system-driven wherever policy allows.
- **Role-based simplicity:** each role sees only the actions and data relevant to them.
- **Auditability:** every upload, calculation, and redemption decision should be traceable.
- **Fairness and consistency:** the same rules must always produce the same results.

## Top Features

The first release must prioritize these three feature groups:

### 1. Automated Token Calculation Engine

The system must calculate total tokens automatically based on division-specific inputs, period rules, downgrade rules, and reset conditions.

### 2. Employee Dashboard and Reward Catalog

Employees must be able to see total points, tier, token age, remaining balance, and redeemable items without needing manual confirmation from admins.

### 3. Monthly Data Upload and Admin Operations

HC PM must be able to upload monthly files, review validation results, execute processing safely, and manage redemption statuses from one admin workspace.

## Functional Requirements

## 1. Authentication and Access

- The system must support secure login for employees, HC PM admins, and team leaders.
- The system must enforce role-based access control.
- Employees can only access their own loyalty data.
- Team leaders can access team-level visibility within assigned scope.
- HC PM can access upload, policy, and redemption administration features.

## 2. Employee Dashboard

The employee dashboard must display:

- Current total tokens.
- Current membership tier / grading.
- Token age and remaining valid tokens.
- Period status and upcoming cut-off information.
- Reward eligibility status.
- Redemption history.
- Status indicators related to downgrade, reset, or inactive/resign constraints.

The dashboard should emphasize point visibility first, followed by tier progress and rewards.

## 3. Team Leader View

The team leader workspace must allow leaders to:

- View team member loyalty summaries.
- Monitor token accumulation trends.
- Identify members eligible for redemption.
- Detect members affected by reset or downgrade logic.
- Filter by division, status, or period where relevant.

## 4. Monthly Data Upload

The admin panel must support monthly upload flows for structured files such as Excel or CSV.

### Upload Requirements

- Upload file templates for Optel and Techno sources.
- Validate file structure before processing.
- Show row-level errors and warnings.
- Prevent partial processing without admin confirmation.
- Preserve upload history with timestamp, uploader, source type, and processing status.

### Source Files

**Optel inputs** may include:
- Exclusive partner data.
- Slot data.
- Accumulated slots and regular slots.

**Techno inputs** may include:
- Sprint data.
- Techno employee database.

**Shared operational inputs** may include:
- Project rejection data.
- Partnership or resign status updates.

## 5. Token and Tier Engine

The rules engine must:

- Calculate total tokens from division-specific inputs.
- Support Optel slot logic and Techno sprint logic.
- Calculate token age.
- Calculate remaining valid tokens.
- Determine membership grading / tier.
- Apply downgrade checks when project rejection or inactivity rules require it.
- Apply reset logic when rule conditions are met.
- Produce a ledger-like result that can be reviewed and audited.

The engine should be deterministic, versionable, and testable.

## 6. Earning Period and Cut-Off Management

The system must support two fixed earning periods:

- **Period 1 (P1):** December 16 to June 15
- **Period 2 (P2):** June 16 to December 15

### Cut-Off Logic

- Token accumulation must freeze at each cut-off date.
- The system must generate a cut-off snapshot for redeem-day calculations.
- Snapshot data must remain auditable even if later uploads update subsequent periods.
- Admins must be able to view the active period and the latest completed snapshot.

## 7. Reward Catalog

The reward catalog must:

- Display redeemable items.
- Show token cost per item.
- Indicate availability or active redemption period.
- Show whether the employee has enough tokens.
- Support future extensibility for categories, images, or stock limits.

## 8. Redemption Workflow

The system must support this end-to-end workflow:

1. Employee selects a reward and submits a redemption request.
2. System validates token sufficiency and partnership / resign eligibility.
3. HC PM verifies the request.
4. Team leader can be notified based on business rules.
5. HC PM updates status to purchased / scheduled / completed as the fulfillment process progresses.
6. Employee picks up the item offline with ID verification.

### Validation Rules

- User must have total tokens greater than or equal to item cost.
- User must have active partnership status.
- Resigned employees are not eligible to redeem.
- Requests outside valid redeem windows must be blocked.

### Redemption Statuses

Recommended statuses:
- Draft
- Pending Verification
- Verified
- Rejected
- Purchased
- Pickup Scheduled
- Completed
- Cancelled

## 9. Notifications

The first release should support in-app notifications and system messages for:

- Monthly update completion.
- Reward request submission.
- Reward verification result.
- Pickup scheduling.
- Status changes affecting tier or redemption eligibility.

Email or WhatsApp notifications can be treated as a later enhancement unless already available in internal infrastructure.

## 10. Audit and History

The platform must preserve history for:

- Upload events.
- Calculation runs.
- Tier changes.
- Reset or downgrade outcomes.
- Redemption status changes.
- Manual admin overrides.

Each critical event should capture actor, timestamp, previous value, new value, and reason when applicable.

## Information Architecture

### Employee Navigation

- Dashboard
- My Progress
- Rewards
- Redemption History
- Profile / Status

### Team Leader Navigation

- Team Overview
- Team Members
- Reward Eligibility
- Alerts / Exceptions

### Admin Navigation

- Dashboard
- Monthly Uploads
- Processing Runs
- Users
- Reward Catalog
- Redemption Requests
- Snapshots
- Audit Log
- Settings / Rules

## User Stories

### Employee

- As an employee, I want to see my total tokens immediately after login so that I understand my current loyalty standing.
- As an employee, I want to know my current tier and progress so that I can plan toward the next milestone.
- As an employee, I want to browse rewards and see token cost so that I can decide what to redeem.
- As an employee, I want the system to tell me why I cannot redeem so that the rules are transparent.

### Team Leader

- As a team leader, I want to see my team's loyalty status so that I can monitor motivation and progress.
- As a team leader, I want to identify members affected by resets or low progress so that I can follow up appropriately.

### HC PM

- As an admin, I want to upload monthly files and validate them before processing so that I can reduce manual mistakes.
- As an admin, I want calculation results to be consistent and auditable so that I can trust the system as the operational source of truth.
- As an admin, I want to manage redemption requests through fulfillment so that the process is trackable and efficient.

## Non-Functional Requirements

### Performance

- Dashboard pages should load quickly for typical internal usage.
- Monthly upload validation should provide feedback within a reasonable operational time for expected file sizes.
- Search and filters in admin views should remain responsive.

### Security

- All data access must follow role-based permissions.
- Sensitive employee data must be protected in transit and at rest.
- Admin actions must be logged.

### Reliability

- Calculation results must be repeatable from the same input data and rule version.
- Snapshot and redemption records must be durable and recoverable.

### Usability

- The interface must be understandable for non-technical internal users.
- Key numbers must be visible without reading dense tables.
- Validation errors must be explicit and actionable.

### Accessibility

- The portal should meet modern web accessibility standards for keyboard navigation, color contrast, labels, and focus states.

## Assumptions

- Employee identity and role data can be sourced from an internal user directory or managed directly in the portal.
- Monthly source files will continue to exist at least in the initial phase.
- Reward pickup remains an offline operational process.
- The organization accepts role-based access for employees, team leaders, and HC PM.

## Constraints

- Two divisions use different earning models and must be supported in one product.
- Fixed cut-off dates are mandatory business rules.
- Resign and partnership status affect reward eligibility.
- Existing Excel templates and process flows influence the first release design.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Source files contain inconsistent structure | Upload failures or incorrect results | Strict template validation, sample files, row-level error reporting |
| Business rules are revised after build starts | Rework in calculation logic | Versioned rules engine and configurable thresholds where possible |
| Employees do not trust automated results at launch | Low adoption | Show transparent token breakdowns and reason messages |
| Redemption workflow becomes operationally blocked | Poor user experience | Clear statuses, SLA ownership, and admin exception handling |
| Team structure or role mappings are incomplete | Incorrect data visibility | Sync checks and admin review tools for role assignment |

## Release Strategy

### Phase 1: MVP

- Secure login and role-based access.
- Employee dashboard with total points, tier, and rewards visibility.
- Admin monthly upload and processing.
- Token and tier engine for Optel and Techno.
- Fixed period and snapshot logic.
- Reward catalog.
- Basic redemption request flow and admin status management.
- Team leader summary view.

### Phase 2: Enhancements

- Richer notification channels.
- Better trend visualizations and historical charts.
- Configurable rule management UI.
- Inventory integration.
- Advanced analytics and export tools.

## Acceptance Criteria for MVP

The MVP is acceptable when:

- Employees can log in and see total tokens, tier, and reward eligibility.
- HC PM can upload monthly files for both divisions and process them successfully.
- The system applies period, cut-off, downgrade, and reset rules correctly.
- Team leaders can view team-level loyalty summaries.
- Reward requests can be submitted, validated, and tracked to completion.
- Audit logs are available for critical operational events.

## Open Questions

- What exact formulas define total tokens for each division and each input type?
- Which downgrade and reset rules should be configurable versus hardcoded?
- Are reward inventories limited and, if so, how should stock reservation work?
- What internal source provides authoritative resign and partnership status?
- Should team leader notifications be mandatory or configurable?
- What SLA should govern verification and fulfillment stages?

## Product Summary

This product should launch as an internal operational portal that makes the loyalty program transparent for employees and manageable for HC PM. The best first-use experience is a dashboard that immediately explains current points, tier, and reward eligibility, while the best operational experience is a reliable monthly upload-to-redemption workflow with strong auditability.
