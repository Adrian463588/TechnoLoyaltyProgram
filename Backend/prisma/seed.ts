/**
 * Prisma Seed Script
 * Populates the database with demo data based on current schema.
 *
 * Run with: npx tsx prisma/seed.ts
 */

import "dotenv/config";
import { PrismaClient, UserRole, DivisionType, MemberTierType, TokenEventType, RedemptionStatus, ClaimStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================================
  // PASSWORD HASH
  // ============================================================
  const passwordHash = await bcrypt.hash("password123", 10);

  // ============================================================
  // CLEAN DB (Order matters for foreign keys)
  // ============================================================
  console.log("🗑️ Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.partnerStatusConfirmation.deleteMany();
  await prisma.redemptionStatusHistory.deleteMany();
  await prisma.redemptionRequest.deleteMany();
  await prisma.rewardItem.deleteMany();
  await prisma.tokenLedger.deleteMany();
  await prisma.membershipHistory.deleteMany();
  await prisma.shiftClaim.deleteMany();
  await prisma.projectClaim.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================
  // USERS & HIERARCHY
  // ============================================================
  console.log("👥 Creating Users...");
  
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@berijalan.id",
      npk: "12345",
      name: "Admin User",
      passwordHash,
      role: UserRole.HC_PM,
      division: DivisionType.OPCENT,
    },
  });

  const leaderUser = await prisma.user.create({
    data: {
      email: "leader@berijalan.id",
      npk: "23456",
      name: "Leader User",
      passwordHash,
      role: UserRole.TEAM_LEADER,
      division: DivisionType.OPCENT,
    },
  });

  // Create Mitras and assign them to the leader
  const alice = await prisma.user.create({
    data: {
      email: "alice@berijalan.id",
      npk: "34567",
      name: "Alice Optel",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.OPCENT,
      membershipTier: MemberTierType.EMERALD,
      teamLeadId: leaderUser.id,
    },
  });

  const saphireUser = await prisma.user.create({
    data: {
      email: "saphire@berijalan.id",
      npk: "40001",
      name: "Saphire Mitra",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.TELE,
      membershipTier: MemberTierType.SAPHIRE,
      teamLeadId: leaderUser.id,
    },
  });

  const emeraldUser = await prisma.user.create({
    data: {
      email: "emerald@berijalan.id",
      npk: "40002",
      name: "Emerald Mitra",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.OPCENT,
      membershipTier: MemberTierType.EMERALD,
      teamLeadId: leaderUser.id,
    },
  });

  const rubyUser = await prisma.user.create({
    data: {
      email: "ruby@berijalan.id",
      npk: "40003",
      name: "Ruby Mitra",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.TECHNO,
      membershipTier: MemberTierType.RUBY,
      teamLeadId: leaderUser.id,
    },
  });

  const diamondUser = await prisma.user.create({
    data: {
      email: "diamond@berijalan.id",
      npk: "40004",
      name: "Diamond Mitra",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.TECHNO,
      membershipTier: MemberTierType.DIAMOND,
      teamLeadId: leaderUser.id,
    },
  });

  console.log("✅ Users created and hierarchy established.");

  // ============================================================
  // MEMBERSHIP HISTORY
  // ============================================================
  console.log("📜 Adding Membership History...");
  await prisma.membershipHistory.createMany({
    data: [
      {
        userId: rubyUser.id,
        previousTier: MemberTierType.EMERALD,
        newTier: MemberTierType.RUBY,
        changeReason: "UPGRADE",
        triggeredBy: "SYSTEM",
        tokenBalanceBefore: 1500,
        tokenBalanceAfter: 2500,
      },
      {
        userId: diamondUser.id,
        previousTier: MemberTierType.RUBY,
        newTier: MemberTierType.DIAMOND,
        changeReason: "UPGRADE",
        triggeredBy: "SYSTEM",
        tokenBalanceBefore: 3000,
        tokenBalanceAfter: 5000,
      }
    ]
  });

  // ============================================================
  // TOKEN LEDGER
  // ============================================================
  console.log("🪙 Adding Token Ledger Entries...");
  const ledgerEntries = [
    { userId: alice.id, amount: 1500, event: TokenEventType.EARNED_SHIFT, reason: "Initial balance" },
    { userId: saphireUser.id, amount: 200, event: TokenEventType.EARNED_SHIFT, reason: "Starter tokens" },
    { userId: emeraldUser.id, amount: 800, event: TokenEventType.EARNED_SHIFT, reason: "Mid-tier rewards" },
    { userId: rubyUser.id, amount: 2500, event: TokenEventType.EARNED_PROJECT, reason: "High-tier rewards" },
    { userId: diamondUser.id, amount: 5000, event: TokenEventType.EARNED_PROJECT, reason: "Elite tier rewards" },
  ];

  for (const entry of ledgerEntries) {
    await prisma.tokenLedger.create({
      data: {
        userId: entry.userId,
        eventType: entry.event,
        amount: entry.amount,
        balanceAfter: entry.amount,
        performedBy: adminUser.id,
        reason: entry.reason,
      },
    });
  }

  // ============================================================
  // CLAIMS (SHIFT & PROJECT)
  // ============================================================
  console.log("📝 Adding Claims...");
  await prisma.shiftClaim.create({
    data: {
      mitraId: alice.id,
      slotCount: 5,
      shiftDate: new Date(),
      status: ClaimStatus.APPROVED,
      validatedBy: adminUser.id,
      validatedAt: new Date(),
    }
  });

  await prisma.projectClaim.create({
    data: {
      mitraId: diamondUser.id,
      projectName: "Project Alpha Revamp",
      completedAt: new Date(),
      status: ClaimStatus.PENDING,
    }
  });

  // ============================================================
  // REWARD ITEMS
  // ============================================================
  console.log("🎁 Adding Reward Items...");
  const rewards = [
    {
      name: "GoPay Voucher Rp100.000",
      description: "Voucher GoPay senilai Rp100.000.",
      tokenCost: 1000,
      createdBy: adminUser.id,
      isActive: true,
      stock: 50,
    },
    {
      name: "Tumbler Premium",
      description: "Tumbler branded Berijalan. Kualitas tinggi, menjaga suhu minuman.",
      tokenCost: 500,
      createdBy: adminUser.id,
      isActive: true,
      stock: 100,
    },
    {
      name: "MacBook Pro M3",
      description: "Reward eksklusif Diamond Tier.",
      tokenCost: 50000,
      createdBy: adminUser.id,
      isActive: true,
      category: "DIAMOND",
      stock: 2,
    }
  ];

  await prisma.rewardItem.createMany({ data: rewards });

  // ============================================================
  // REDEMPTION REQUEST & PARTNER STATUS CONFIRMATION (TL-01)
  // ============================================================
  console.log("🔄 Adding Redemption Requests and Partner Confirmations...");
  const rewardItem = await prisma.rewardItem.findFirst({
    where: { name: "Tumbler Premium" },
  });

  if (rewardItem) {
    const redemption = await prisma.redemptionRequest.create({
      data: {
        mitraId: alice.id,
        rewardItemId: rewardItem.id,
        tokenCost: rewardItem.tokenCost,
        status: RedemptionStatus.PENDING_VERIFICATION,
        history: {
          create: {
            previousStatus: RedemptionStatus.DRAFT,
            newStatus: RedemptionStatus.PENDING_VERIFICATION,
            changedBy: alice.id,
            note: "Request submitted by Mitra",
          }
        }
      }
    });

    // Create a Partner Status Confirmation request (from HC to TL)
    await prisma.partnerStatusConfirmation.create({
      data: {
        redemptionRequestId: redemption.id,
        mitraId: alice.id,
        requestedBy: adminUser.id,
        assignedTo: leaderUser.id,
        status: "PENDING",
      }
    });
  }

  // ============================================================
  // AUDIT LOGS
  // ============================================================
  console.log("🛡️ Adding Audit Logs...");
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: "TOKEN_MANUAL_ADJUST",
      targetUserId: alice.id,
      newValue: { amount: 1500, reason: "Initial balance" },
      ipAddress: "127.0.0.1",
      userAgent: "Seed Script",
    }
  });

  console.log("\n🎉 Seed complete! All conditions and best practices applied.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
