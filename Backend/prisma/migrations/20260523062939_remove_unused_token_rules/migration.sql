-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MITRA', 'TEAM_LEADER', 'HC_PM');

-- CreateEnum
CREATE TYPE "DivisionType" AS ENUM ('OPCENT', 'TELE', 'TECHNO');

-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RESIGNED');

-- CreateEnum
CREATE TYPE "MemberTierType" AS ENUM ('SAPHIRE', 'EMERALD', 'RUBY', 'DIAMOND');

-- CreateEnum
CREATE TYPE "HealthBenefit" AS ENUM ('NONE', 'FIT', 'CLASSY');

-- CreateEnum
CREATE TYPE "TokenEventType" AS ENUM ('EARNED_SHIFT', 'EARNED_PROJECT', 'REDEEMED', 'EXPIRED', 'MANUAL_ADJUSTMENT', 'DOWNGRADE_PENALTY', 'RESET_PENALTY');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('STAGED', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('REQUESTED', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "npk" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "division" "DivisionType" NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MITRA',
    "partnerStatus" "PartnershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "membershipTier" "MemberTierType" NOT NULL DEFAULT 'SAPHIRE',
    "healthBenefit" "HealthBenefit" NOT NULL DEFAULT 'NONE',
    "teamLeadId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "TokenEventType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceId" TEXT,
    "earnedYear" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "previousTier" "MemberTierType" NOT NULL,
    "newTier" "MemberTierType" NOT NULL,
    "changeReason" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "tokenBalanceBefore" INTEGER NOT NULL,
    "tokenBalanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftClaim" (
    "id" TEXT NOT NULL,
    "mitraId" TEXT NOT NULL,
    "slotCount" INTEGER NOT NULL,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectClaim" (
    "id" TEXT NOT NULL,
    "mitraId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tokenCost" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT,
    "minTier" "MemberTierType" NOT NULL DEFAULT 'SAPHIRE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedemptionRequest" (
    "id" TEXT NOT NULL,
    "mitraId" TEXT NOT NULL,
    "rewardItemId" TEXT NOT NULL,
    "tokenCost" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'REQUESTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "pickupScheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "idCardVerified" BOOLEAN NOT NULL DEFAULT false,
    "ktpVerified" BOOLEAN NOT NULL DEFAULT false,
    "npwpVerified" BOOLEAN NOT NULL DEFAULT false,
    "isRepresented" BOOLEAN NOT NULL DEFAULT false,
    "powerOfAttorneyUrl" TEXT,
    "powerOfAttorneyRequired" BOOLEAN NOT NULL DEFAULT false,
    "powerOfAttorneyVerified" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedemptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedemptionStatusHistory" (
    "id" TEXT NOT NULL,
    "redemptionRequestId" TEXT NOT NULL,
    "previousStatus" "RedemptionStatus" NOT NULL,
    "newStatus" "RedemptionStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedemptionStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetEntityType" TEXT,
    "targetEntityId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "summary" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerStatusConfirmation" (
    "id" TEXT NOT NULL,
    "redemptionRequestId" TEXT NOT NULL,
    "mitraId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerStatusConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL_CONFIG',
    "p1Start" TEXT NOT NULL DEFAULT '06-16',
    "p1End" TEXT NOT NULL DEFAULT '12-15',
    "p2Start" TEXT NOT NULL DEFAULT '12-16',
    "p2End" TEXT NOT NULL DEFAULT '06-15',
    "claimP1Start" TEXT NOT NULL DEFAULT '01-01',
    "claimP1End" TEXT NOT NULL DEFAULT '01-31',
    "claimP2Start" TEXT NOT NULL DEFAULT '07-01',
    "claimP2End" TEXT NOT NULL DEFAULT '07-31',
    "rewardPickupLocation" TEXT NOT NULL DEFAULT 'HC Office - Main Building',
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_npk_key" ON "User"("npk");

-- CreateIndex
CREATE INDEX "TokenLedger_userId_createdAt_idx" ON "TokenLedger"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TokenLedger_userId_eventType_idx" ON "TokenLedger"("userId", "eventType");

-- CreateIndex
CREATE INDEX "MembershipHistory_userId_createdAt_idx" ON "MembershipHistory"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "JobRun_jobName_periodKey_idx" ON "JobRun"("jobName", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "JobRun_jobName_periodKey_key" ON "JobRun"("jobName", "periodKey");

-- CreateIndex
CREATE INDEX "PartnerStatusConfirmation_redemptionRequestId_idx" ON "PartnerStatusConfirmation"("redemptionRequestId");

-- CreateIndex
CREATE INDEX "PartnerStatusConfirmation_assignedTo_status_idx" ON "PartnerStatusConfirmation"("assignedTo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserDocument_userId_type_key" ON "UserDocument"("userId", "type");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenLedger" ADD CONSTRAINT "TokenLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipHistory" ADD CONSTRAINT "MembershipHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftClaim" ADD CONSTRAINT "ShiftClaim_mitraId_fkey" FOREIGN KEY ("mitraId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectClaim" ADD CONSTRAINT "ProjectClaim_mitraId_fkey" FOREIGN KEY ("mitraId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionRequest" ADD CONSTRAINT "RedemptionRequest_mitraId_fkey" FOREIGN KEY ("mitraId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionRequest" ADD CONSTRAINT "RedemptionRequest_rewardItemId_fkey" FOREIGN KEY ("rewardItemId") REFERENCES "RewardItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionStatusHistory" ADD CONSTRAINT "RedemptionStatusHistory_redemptionRequestId_fkey" FOREIGN KEY ("redemptionRequestId") REFERENCES "RedemptionRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerStatusConfirmation" ADD CONSTRAINT "PartnerStatusConfirmation_redemptionRequestId_fkey" FOREIGN KEY ("redemptionRequestId") REFERENCES "RedemptionRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerStatusConfirmation" ADD CONSTRAINT "PartnerStatusConfirmation_mitraId_fkey" FOREIGN KEY ("mitraId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerStatusConfirmation" ADD CONSTRAINT "PartnerStatusConfirmation_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerStatusConfirmation" ADD CONSTRAINT "PartnerStatusConfirmation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
