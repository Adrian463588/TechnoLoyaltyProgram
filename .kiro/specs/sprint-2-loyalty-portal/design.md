# Design Document - Sprint 2: Berijalan Employee Loyalty Program Portal

## 1. Architecture Overview

This document outlines the technical design for Sprint 2 of the Berijalan Employee Loyalty Program Portal. Sprint 2 implements the core infrastructure including database schema alignment, authentication with role-based routing, token calculation engines for Opcent/Tele and Techno divisions, membership downgrade/reset logic, redemption workflows, and the initial frontend dashboard.

### 1.1 System Context

The application follows a client-server architecture with a Next.js frontend and Express.js backend using PostgreSQL for data persistence. The token system uses an append-only ledger pattern to maintain financial integrity.

### 1.2 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui |
| Backend | Express.js, TypeScript (strict mode) |
| Database | PostgreSQL with Prisma ORM |
| Forms | React Hook Form + Zod |
| Auth | NextAuth.js v5 |
| Testing | Vitest (unit), Cypress (E2E) |

---

## 2. Database Schema Alignment

### 2.1 Required Enums

The Prisma schema must define these enums matching PRD Section 5:

```typescript
// DivisionType - aligns with PRD Division enum
enum DivisionType {
  OPCENT  // Opcent division (slot-based)
  TELE   // Tele division (slot-based)  
  TECHNO // Techno division (project-based)
}

// MemberTierType - aligns with PRD MembershipTier
enum MemberTierType {
  SAPHIRE  = 'SAPHIRE'   // Default tier (0 slots/projects)
  EMERALD  = 'EMERALD'   // 430 slots / 25 projects
  RUBY     = 'RUBY'      // 860 slots / 50 projects
  DIAMOND  = 'DIAMOND'   // 1300 slots / 75 projects
}

// PartnershipStatus - aligns with PRD PartnerStatus
enum PartnershipStatus {
  ACTIVE   = 'ACTIVE'
  INACTIVE = 'INACTIVE'
  RESIGNED = 'RESIGNED'
}

// TokenEventType - for TokenLedger entries
enum TokenEventType {
  EARNED_SHIFT       = 'EARNED_SHIFT'
  EARNED_PROJECT     = 'EARNED_PROJECT'
  REDEEMED           = 'REDEEMED'
  EXPIRED            = 'EXPIRED'
  MANUAL_ADJUSTMENT  = 'MANUAL_ADJUSTMENT'
  DOWNGRADE_PENALTY  = 'DOWNGRADE_PENALTY'  // 50% cut
  RESET_PENALTY      = 'RESET_PENALTY'      // Full reset to 0
}

// HealthBenefit - per tier
enum HealthBenefit {
  NONE   = 'NONE'   // SAPHIRE
  FIT    = 'FIT'    // EMERALD, RUBY
  CLASSY = 'CLASSY' // DIAMOND
}
```

### 2.2 Core Entities

The following entities must exist with specified relationships:

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| User | id, email, name, role, division, partnerStatus | Role enum: MITRA, TEAM_LEADER, HC_ADMIN |
| TokenLedger | id, userId, eventType, amount, balanceAfter, earnedYear, expiresAt, reason, performedBy | Append-only, no UPDATE/DELETE |
| MembershipHistory | id, userId, previousTier, newTier, changeReason, tokenBalanceBefore/After | Append-only |
| ShiftClaim | id, mitraId, slotCount, shiftDate, status | Opcent/Tele only |
| ProjectClaim | id, mitraId, projectName, completedAt, status | Techno only |
| RewardItem | id, name, tokenCost, isActive, stock | Redemption catalog |
| RedemptionRequest | id, mitraId, rewardItemId, status, tokensSpent | Status machine: DRAFT→PENDING_VERIFICATION→VERIFIED→PURCHASED→PICKUP_SCHEDULED→COMPLETED |
| AuditLog | id, actorId, action, targetUserId, targetEntityType, previousValue, newValue | All admin mutations |

### 2.3 Required Indexes

```sql
-- TokenLedger indexes for performance
CREATE INDEX idx_token_ledger_user_created ON "TokenLedger"(userId, createdAt);
CREATE INDEX idx_token_ledger_earned_year ON "TokenLedger"(earnedYear);

-- Redemption request indexes
CREATE INDEX idx_redemption_status ON "RedemptionRequest"(mitraId, status);

-- Audit log indexes
CREATE INDEX idx_audit_actor_action ON "AuditLog"(actorId, action);
```

---

## 3. Authentication & Authorization

### 3.1 NextAuth Configuration

The authentication system uses NextAuth.js v5 with credentials provider:

```typescript
// Backend/src/auth/config.ts
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Validate against User table
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.division = user.division;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.division = token.division;
      return session;
    }
  }
};
```

### 3.2 Role-Based Routing Middleware

Middleware enforces role-based access at the route level:

```typescript
// Frontend/src/middleware.ts
export function middleware(request: NextRequest) {
  const session = await getSession();
  
  // Unauthenticated redirect
  if (!session && !isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Role-based route protection
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/admin') && session?.user?.role !== 'HC_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (path.startsWith('/leader') && !['HC_ADMIN', 'TEAM_LEADER'].includes(session?.user?.role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

### 3.3 Route Layout Structure

```
src/app/
├── (auth)/           # Public routes (login, forgot-password)
│   ├── login/
│   └── layout.tsx    # No sidebar/header
├── (mitra)/          # Mitra-only routes
│   ├── dashboard/
│   ├── rewards/
│   ├── claims/
│   └── layout.tsx    # Mitra navigation shell
├── (leader)/         # Team Lead routes  
│   ├── team/
│   ├── validation/
│   └── layout.tsx    # Lead navigation shell
├── (admin)/          # HC Admin routes
│   ├── users/
│   ├── redemptions/
│   ├── catalog/
│   ├── audit-logs/
│   └── layout.tsx    # Admin navigation shell
└── page.tsx          # Root redirect based on role
```

---

## 4. Token Ledger Repository

### 4.1 Append-Only Pattern

The TokenLedger follows an append-only pattern where balance is computed from the sum of all ledger entries, never cached:

```typescript
// Backend/src/repositories/token-ledger.repository.ts
export class TokenLedgerRepository {
  /**
   * Credit tokens to a user's account - INSERT only, never UPDATE
   */
  async creditTokens(
    userId: string,
    amount: number,
    eventType: TokenEventType,
    options: {
      referenceId?: string;
      earnedYear?: number;
      reason?: string;
      performedBy: string;
    }
  ): Promise<TokenLedger> {
    return this.prisma.$transaction(async (tx) => {
      // Get current balance
      const currentBalance = await this.computeBalance(tx, userId);
      
      // Calculate new balance
      const balanceAfter = currentBalance + amount;
      
      // Calculate expiry (December 31 of earnedYear + 3)
      const earnedYear = options.earnedYear ?? new Date().getFullYear();
      const expiresAt = new Date(earnedYear + 3, 11, 31, 23, 59, 59);
      
      // Insert only - never update
      const ledger = await tx.tokenLedger.create({
        data: {
          userId,
          eventType,
          amount,
          balanceAfter,
          referenceId: options.referenceId,
          earnedYear,
          expiresAt,
          reason: options.reason,
          performedBy: options.performedBy
        }
      });
      
      return ledger;
    });
  }

  /**
   * Debit tokens from a user's account
   */
  async debitTokens(
    userId: string,
    amount: number,
    eventType: TokenEventType,
    options: {
      referenceId?: string;
      reason?: string;
      performedBy: string;
    }
  ): Promise<TokenLedger> {
    return this.creditTokens(userId, -Math.abs(amount), eventType, options);
  }

  /**
   * Compute current balance from ledger - never read from cached column
   */
  async getBalance(userId: string): Promise<number> {
    const result = await this.prisma.tokenLedger.aggregate({
      where: { userId },
      _sum: { amount: true }
    });
    return result._sum.amount ?? 0;
  }

  private async computeBalance(tx: PrismaClient, userId: string): Promise<number> {
    const result = await tx.tokenLedger.aggregate({
      where: { userId },
      _sum: { amount: true }
    });
    return result._sum.amount ?? 0;
  }
}
```

### 4.2 Atomic Transaction Requirements

All balance changes MUST occur within a Prisma transaction to ensure consistency. The `balanceAfter` field stores a snapshot for audit purposes but is always computed within the transaction.

---

## 5. Token Calculation Engines

### 5.1 Opcent/Tele Token Engine

The Opcent/Tele engine calculates tokens based on slots with annual evaluation:

```typescript
// Backend/src/services/token-engine/opcent/engine.ts
export interface OpcentConfig {
  thresholds: {
    EMERALD: number;  // 430 slots
    RUBY: number;     // 860 slots
    DIAMOND: number;  // 1300 slots
  };
  evaluationDeadline: string; // "12-15" (December 15)
}

export const OPCENT_CONFIG: OpcentConfig = {
  thresholds: {
    EMERALD: 430,
    RUBY: 860,
    DIAMOND: 1300
  },
  evaluationDeadline: '12-15'
};

export class OpcentTokenEngine {
  /**
   * Calculate tokens earned from slot count (1:1 ratio)
   */
  calculateTokens(slotCount: number): number {
    return slotCount; // 1 slot = 1 token
  }

  /**
   * Determine membership tier based on cumulative slots
   */
  calculateTier(totalSlots: number): MemberTierType {
    if (totalSlots >= OPCENT_CONFIG.thresholds.DIAMOND) return 'DIAMOND';
    if (totalSlots >= OPCENT_CONFIG.thresholds.RUBY) return 'RUBY';
    if (totalSlots >= OPCENT_CONFIG.thresholds.EMERALD) return 'EMERALD';
    return 'SAPHIRE';
  }

  /**
   * Determine health benefit based on tier
   */
  getHealthBenefit(tier: MemberTierType): HealthBenefit {
    switch (tier) {
      case 'DIAMOND': return 'CLASSY';
      case 'RUBY':
      case 'EMERALD': return 'FIT';
      default: return 'NONE';
    }
  }

  /**
   * Check if within evaluation period (before December 15)
   */
  isWithinEvaluationPeriod(date: Date = new Date()): boolean {
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();
    // P2: June 16 (month 5) - December 15 (month 11, day 15)
    return (month >= 5 && (month < 11 || (month === 11 && day <= 15)));
  }

  /**
   * Calculate progress to next tier
   */
  getProgressToNextTier(currentSlots: number): {
    currentTier: MemberTierType;
    nextTier: MemberTierType | null;
    slotsNeeded: number;
    progressPercent: number;
  } {
    const currentTier = this.calculateTier(currentSlots);
    const thresholds = Object.entries(OPCENT_CONFIG.thresholds)
      .filter(([_, value]) => value > currentSlots)
      .sort((a, b) => a[1] - b[1]);

    if (thresholds.length === 0) {
      return { currentTier, nextTier: null, slotsNeeded: 0, progressPercent: 100 };
    }

    const [nextTier, nextThreshold] = thresholds[0];
    const slotsNeeded = nextThreshold - currentSlots;
    const currentThreshold = currentSlots; // Simplified
    
    return {
      currentTier,
      nextTier: nextTier as MemberTierType,
      slotsNeeded,
      progressPercent: Math.min(100, Math.round((currentSlots / nextThreshold) * 100))
    };
  }
}
```

### 5.2 Techno Token Engine

The Techno engine calculates based on projects with 6-month evaluation periods:

```typescript
// Backend/src/services/token-engine/techno/engine.ts
export interface TechnoConfig {
  thresholds: {
    EMERALD: number;  // 25 projects
    RUBY: number;     // 50 projects
    DIAMOND: number;  // 75 projects
  };
  evaluationPeriodMonths: number; // 6 months
}

export const TECHNO_CONFIG: TechnoConfig = {
  thresholds: {
    EMERALD: 25,
    RUBY: 50,
    DIAMOND: 75
  },
  evaluationPeriodMonths: 6
};

export class TechnoTokenEngine {
  /**
   * Calculate tokens earned from project count (1:1 ratio for tier)
   */
  calculateTokens(projectCount: number): number {
    return projectCount;
  }

  /**
   * Determine membership tier based on projects in evaluation period
   */
  calculateTier(projectCount: number): MemberTierType {
    if (projectCount >= TECHNO_CONFIG.thresholds.DIAMOND) return 'DIAMOND';
    if (projectCount >= TECHNO_CONFIG.thresholds.RUBY) return 'RUBY';
    if (projectCount >= TECHNO_CONFIG.thresholds.EMERALD) return 'EMERALD';
    return 'SAPHIRE';
  }

  /**
   * Get health benefit for tier
   */
  getHealthBenefit(tier: MemberTierType): HealthBenefit {
    switch (tier) {
      case 'DIAMOND': return 'CLASSY';
      case 'RUBY':
      case 'EMERALD': return 'FIT';
      default: return 'NONE';
    }
  }

  /**
   * Get current evaluation period (P1 or P2)
   */
  getCurrentPeriod(date: Date = new Date()): 'P1' | 'P2' {
    const month = date.getMonth();
    // P1: December 16 - June 15 (months 11, 0-5)
    // P2: June 16 - December 15 (months 5-11)
    if (month >= 11 || month <= 5) {
      return month === 11 ? 'P1' : (month <= 5 ? 'P1' : 'P2');
    }
    return 'P2';
  }

  /**
   * Calculate progress to next tier
   */
  getProgressToNextTier(currentProjects: number): {
    currentTier: MemberTierType;
    nextTier: MemberTierType | null;
    projectsNeeded: number;
    progressPercent: number;
  } {
    const currentTier = this.calculateTier(currentProjects);
    const thresholds = Object.entries(TECHNO_CONFIG.thresholds)
      .filter(([_, value]) => value > currentProjects)
      .sort((a, b) => a[1] - b[1]);

    if (thresholds.length === 0) {
      return { currentTier, nextTier: null, projectsNeeded: 0, progressPercent: 100 };
    }

    const [nextTier, nextThreshold] = thresholds[0];
    const projectsNeeded = nextThreshold - currentProjects;

    return {
      currentTier,
      nextTier: nextTier as MemberTierType,
      projectsNeeded,
      progressPercent: Math.min(100, Math.round((currentProjects / nextThreshold) * 100))
    };
  }
}
```

### 5.3 Domain Boundary Isolation

Per AGENTS.md Section 5.4, these engines MUST be isolated:

```
Backend/src/services/token-engine/
├── opcent/
│   ├── engine.ts       # OpcentTokenEngine class
│   ├── constants.ts    # OPCENT_CONFIG, thresholds
│   └── index.ts        # Public API export
├── techno/
│   ├── engine.ts       # TechnoTokenEngine class
│   ├── constants.ts    # TECHNO_CONFIG, thresholds
│   └── index.ts        # Public API export
└── index.ts            # Factory to get correct engine by division
```

---

## 6. Membership Downgrade & Reset Logic

### 6.1 Downgrade Engine

```typescript
// Backend/src/services/membership/downgrade.service.ts
export interface DowngradeConfig {
  inactiveMonthsThreshold: number;  // 3 consecutive months
  penaltyRate: number;              // 0.50 (50%)
}

export const DOWNGRADE_CONFIG: DowngradeConfig = {
  inactiveMonthsThreshold: 3,
  penaltyRate: 0.50
};

export class MembershipDowngradeService {
  constructor(
    private ledgerRepo: TokenLedgerRepository,
    private membershipRepo: MembershipHistoryRepository,
    private auditService: AuditService
  ) {}

  /**
   * Evaluate downgrade conditions for a user
   * Returns downgrade result or null if no downgrade applies
   */
  async evaluateDowngrade(userId: string, division: DivisionType): Promise<DowngradeResult | null> {
    // Get user's claim history for past N months
    const months = await this.getInactiveMonths(userId, division);
    
    if (months < DOWNGRADE_CONFIG.inactiveMonthsThreshold) {
      return null;
    }

    // Apply downgrade
    const currentBalance = await this.ledgerRepo.getBalance(userId);
    const penaltyAmount = Math.floor(currentBalance * DOWNGRADE_CONFIG.penaltyRate);
    const newBalance = currentBalance - penaltyAmount;

    // Get current tier
    const user = await this.userRepository.findById(userId);
    const newTier = this.demoteTier(user.membershipTier);

    // Create ledger entry for penalty
    await this.ledgerRepo.debitTokens(
      userId,
      penaltyAmount,
      'DOWNGRADE_PENALTY',
      {
        reason: `Downgrade penalty: ${months} consecutive inactive months`,
        performedBy: 'SYSTEM'
      }
    );

    // Update user tier
    await this.userRepository.updateTier(userId, newTier);

    // Record history
    await this.membershipRepo.record({
      userId,
      previousTier: user.membershipTier,
      newTier,
      changeReason: 'DOWNGRADE',
      tokenBalanceBefore: currentBalance,
      tokenBalanceAfter: newBalance,
      triggeredBy: 'SYSTEM'
    });

    // Audit log
    await this.auditService.log({
      actorId: 'SYSTEM',
      action: 'TIER_DOWNGRADED',
      targetUserId: userId,
      previousValue: { tier: user.membershipTier, balance: currentBalance },
      newValue: { tier: newTier, balance: newBalance, penaltyApplied: penaltyAmount }
    });

    return {
      previousTier: user.membershipTier,
      newTier,
      penaltyApplied: penaltyAmount,
      newBalance
    };
  }

  private demoteTier(current: MemberTierType): MemberTierType {
    switch (current) {
      case 'DIAMOND': return 'RUBY';
      case 'RUBY': return 'EMERALD';
      case 'EMERALD': return 'SAPHIRE';
      default: return 'SAPHIRE';
    }
  }

  private async getInactiveMonths(userId: string, division: DivisionType): Promise<number> {
    // Query ShiftClaim/ProjectClaim for last 3 months
    // Count months with ANY approved claims
    // Return count of consecutive months with zero claims
  }
}
```

### 6.2 Reset Engine

```typescript
// Backend/src/services/membership/reset.service.ts
export interface ResetConfig {
  unavailableMonthsThreshold: number;  // 3 consecutive months
}

export class MembershipResetService {
  async evaluateReset(userId: string, division: DivisionType): Promise<ResetResult | null> {
    // Similar to downgrade but:
    // 1. Checks for COMPLETE unavailability (not just inactive)
    // 2. Sets balance to 0 (not 50%)
    // 3. Resets tier to SAPHIRE
    
    const currentBalance = await this.ledgerRepo.getBalance(userId);
    
    // Full reset: balance to 0
    await this.ledgerRepo.debitTokens(
      userId,
      currentBalance, // Deduct entire balance
      'RESET_PENALTY',
      {
        reason: `Reset: 3 consecutive months fully unavailable`,
        performedBy: 'SYSTEM'
      }
    );

    // Reset tier to SAPHIRE
    await this.userRepository.updateTier(userId, 'SAPHIRE');
    
    // ... record history and audit
    
    return { previousTier, newTier: 'SAPHIRE', balanceResetTo: 0 };
  }
}
```

---

## 7. Redemption Workflow

### 7.1 Eligibility Guards

All five conditions must pass:

```typescript
// Backend/src/services/redemption/eligibility.service.ts
export class RedemptionEligibilityService {
  async assertEligible(
    user: User,
    item: RewardItem,
    currentBalance: number
  ): Promise<EligibilityResult> {
    const errors: string[] = [];

    // Guard 1: Partner status
    if (user.partnerStatus !== 'ACTIVE') {
      errors.push('PARTNER_NOT_ACTIVE');
    }

    // Guard 2: Sufficient tokens
    if (currentBalance < item.tokenCost) {
      errors.push('INSUFFICIENT_TOKENS');
    }

    // Guard 3: Item active
    if (!item.isActive) {
      errors.push('ITEM_INACTIVE');
    }

    // Guard 4: Stock available
    if (item.stock !== null && item.stock <= 0) {
      errors.push('OUT_OF_STOCK');
    }

    // Guard 5: Within redemption window (optional business rule)
    if (!this.isWithinRedemptionWindow()) {
      errors.push('OUTSIDE_REDEMPTION_WINDOW');
    }

    return {
      eligible: errors.length === 0,
      errors
    };
  }

  private isWithinRedemptionWindow(): boolean {
    // Define redemption window (e.g., always open or restricted periods)
    return true;
  }
}
```

### 7.2 Submit Redemption Server Action

```typescript
// Frontend/src/features/redemption/actions.ts
'use server';

export async function submitRedemptionRequest(
  userId: string,
  rewardItemId: string
): Promise<ActionResult<RedemptionRequest>> {
  // Validate session
  const session = await auth();
  if (!session || session.user.id !== userId) {
    return { success: false, error: 'UNAUTHORIZED' };
  }

  // Fetch user and item
  const user = await userService.findById(userId);
  const item = await rewardService.findById(rewardItemId);
  const balance = await ledgerService.getBalance(userId);

  // Run eligibility guards (server-side, never trust client)
  const eligibility = await eligibilityService.assertEligible(user, item, balance);
  
  if (!eligibility.eligible) {
    return { success: false, error: 'INELIGIBLE', details: eligibility.errors };
  }

  // Create redemption request
  const redemption = await redemptionService.create({
    mitraId: userId,
    rewardItemId,
    tokensSpent: item.tokenCost,
    status: 'PENDING_VERIFICATION'
  });

  return { success: true, data: redemption };
}
```

### 7.3 Manual Token Adjustment (HC Admin)

```typescript
// Frontend/src/features/admin/actions.ts
'use server';

export async function adjustTokenBalance(
  adminId: string,
  targetUserId: string,
  amount: number,
  reason: string
): Promise<ActionResult<void>> {
  // Validate admin role
  const admin = await userService.findById(adminId);
  if (admin.role !== 'HC_ADMIN') {
    return { success: false, error: 'FORBIDDEN' };
  }

  // Validate reason length
  if (reason.length < 10) {
    return { success: false, error: 'REASON_TOO_SHORT' };
  }

  // Check if target is resigned
  const target = await userService.findById(targetUserId);
  if (target.partnerStatus === 'RESIGNED') {
    // Require override confirmation in real implementation
    return { success: false, error: 'CANNOT_ADJUST_RESIGNED' };
  }

  // Get current balance
  const currentBalance = await ledgerService.getBalance(targetUserId);
  const newBalance = currentBalance + amount;

  // Create ledger entry
  const eventType = amount > 0 ? 'MANUAL_ADJUSTMENT' : 'MANUAL_ADJUSTMENT';
  await ledgerService.adjustBalance(
    targetUserId,
    amount,
    eventType,
    { reason, performedBy: adminId }
  );

  // Create audit log
  await auditService.log({
    actorId: adminId,
    action: 'TOKEN_MANUAL_ADJUST',
    targetUserId,
    previousValue: { balance: currentBalance },
    newValue: { balance: newBalance, adjustment: amount, reason }
  });

  return { success: true };
}
```

---

## 8. Frontend Components

### 8.1 TokenHeroSection (Mitra Dashboard)

```typescript
// Frontend/src/components/dashboard/TokenHeroSection.tsx
export function TokenHeroSection({
  balance,
  tier,
  eligibility,
  progress
}: {
  balance: number;
  tier: MemberTierType;
  eligibility: { eligible: boolean; reason?: string };
  progress: { nextTier: string | null; needed: number; percent: number };
}) {
  return (
    <div className="bento-grid">
      {/* Token Balance Hero */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm text-muted">Total Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-mono font-bold text-accent">
            {balance.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Membership Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted">Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <TierBadge tier={tier} />
        </CardContent>
      </Card>

      {/* Eligibility Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted">Eligibility</CardTitle>
        </CardHeader>
        <CardContent>
          {eligibility.eligible ? (
            <span className="text-green-500 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Can Redeem
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {eligibility.reason}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Progress to Next Tier */}
      {progress.nextTier && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-sm text-muted">
              Progress to {progress.nextTier}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress.percent} className="h-2" />
            <p className="text-sm text-muted mt-2">
              {progress.needed} more to unlock
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### 8.2 Shift/Project Claim Form

```typescript
// Frontend/src/features/claims/components/ClaimForm.tsx
'use client';

const claimSchema = z.object({
  type: z.enum(['SLOT', 'PROJECT']),
  // For slots (Opcent/Tele)
  slotCount: z.number().min(1).optional(),
  shiftDate: z.date().optional(),
  // For projects (Techno)
  projectName: z.string().min(1).optional(),
  completionDate: z.date().optional()
}).refine(data => {
  if (data.type === 'SLOT') {
    return data.slotCount && data.shiftDate;
  }
  return data.projectName && data.completionDate;
}, { message: 'Required fields missing' });

export function ClaimForm({ division }: { division: 'OPCENT' | 'TELE' | 'TECHNO' }) {
  const form = useForm({ resolver: zodResolver(claimSchema) });
  
  const onSubmit = async (data: z.infer<typeof claimSchema>) => {
    await submitClaimAction(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields based on division */}
      </form>
    </Form>
  );
}
```

---

## 9. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Token Ledger Append-Only

*For any* user and any sequence of credit and debit operations, the TokenLedger table shall never contain UPDATE or DELETE operations - only INSERT operations shall modify the ledger.

**Validates: Requirements 1.3, 3.4**

### Property 2: Balance Computed from Ledger

*For any* user, the token balance returned by `getBalance(userId)` shall equal the sum of all `amount` values in the user's TokenLedger entries.

**Validates: Requirements 3.5**

### Property 3: Opcent Tier Calculation

*For any* slot count, the OpcentTokenEngine.calculateTier() shall return the correct tier according to the thresholds: EMERALD at ≥430 slots, RUBY at ≥860 slots, DIAMOND at ≥1300 slots, otherwise SAPHIRE.

**Validates: Requirements 4.2**

### Property 4: Techno Tier Calculation

*For any* project count, the TechnoTokenEngine.calculateTier() shall return the correct tier according to the thresholds: EMERALD at ≥25 projects, RUBY at ≥50 projects, DIAMOND at ≥75 projects, otherwise SAPHIRE.

**Validates: Requirements 5.2**

### Property 5: Opcent Slot-Token Conversion

*For any* slot count input, OpcentTokenEngine.calculateTokens() shall return a value equal to the input slot count (1:1 ratio).

**Validates: Requirements 4.1**

### Property 6: Techno Project-Token Conversion

*For any* project count input, TechnoTokenEngine.calculateTokens() shall return a value equal to the input project count (1:1 ratio).

**Validates: Requirements 5.1**

### Property 7: Downgrade Penalty Calculation

*For any* token balance, when downgrade triggers, the penalty amount shall equal `Math.floor(balance * 0.50)`.

**Validates: Requirements 6.2**

### Property 8: Reset Clears Balance

*For any* user balance, when reset triggers, the resulting balance shall be 0 and the tier shall be SAPHIRE.

**Validates: Requirements 7.2**

### Property 9: Redemption Eligibility Guards

*For any* user, reward item, and balance combination, the eligibility check shall validate all five conditions: partner status ACTIVE, sufficient tokens, item isActive, stock available, within redemption window.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.7**

### Property 10: Manual Adjustment Audit Trail

*For any* manual token adjustment performed by an HC_ADMIN, an AuditLog entry shall be created with the actorId, previousValue, newValue, and reason before the operation returns.

**Validates: Requirements 9.4**

### Property 11: Health Benefit Mapping

*For any* membership tier, the health benefit shall be: NONE for SAPHIRE, FIT for EMERALD/RUBY, CLASSY for DIAMOND.

**Validates: Requirements 4.4, 5.4**

### Property 12: Opcent Evaluation Deadline

*For any* date after December 15, OpcentTokenEngine.isWithinEvaluationPeriod() shall return false - tier upgrades are not evaluated after the deadline.

**Validates: Requirements 4.3**

---

## 10. API Design

### 10.1 Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Authenticate user |
| GET | /api/ledger/:userId/balance | Get token balance |
| POST | /api/ledger/credit | Credit tokens (admin) |
| GET | /api/eligibility/:userId | Check redemption eligibility |
| POST | /api/redemptions | Submit redemption request |
| GET | /api/redemptions/pending | List pending redemptions (admin) |
| PATCH | /api/redemptions/:id/status | Update redemption status (admin) |
| POST | /api/claims/shift | Submit shift claim |
| POST | /api/claims/project | Submit project claim |

---

## 11. Testing Strategy

### 11.1 Unit Test Coverage (Vitest)

All token calculation engines, downgrade logic, and eligibility rules require unit tests with boundary value testing:
- Exactly 430 slots (Emerald threshold)
- Exactly 429 slots (boundary - 1)
- Exactly 860 slots (Ruby threshold)
- Exactly 1300 slots (Diamond threshold)
- Exactly 25, 26, 50, 51, 75, 76 projects (Techno boundaries)
- Token balances at 0, 1, and various multiples for 50% penalty calculation

### 11.2 E2E Test Coverage (Cypress)

Core user flows to test:
1. Mitra login → dashboard view (hero section loads)
2. Mitra submits shift/project claim
3. Mitra submits redemption request
4. HC admin approves redemption
5. HC admin performs manual token adjustment

### 11.3 Integration Tests

- Token ledger atomic transactions
- Membership downgrade/reset scheduled job
- Redemption status machine transitions

---

## 12. Security Considerations

### 12.1 Role Enforcement Layers

| Layer | Implementation |
|-------|---------------|
| Layer 1 | `middleware.ts` - unauthenticated redirect |
| Layer 2 | `(role)/layout.tsx` - server-side role check |
| Layer 3 | Server actions/API routes - re-validate session + role |
| Layer 4 | Repository - ownership check |

### 12.2 Sensitive Data Handling

- Personal data (name, email, KTP) must never appear in client-side logs
- Manual adjustments require mandatory reason (min 10 chars)
- All admin mutations create AuditLog entries
- Session tokens use HTTP-only cookies