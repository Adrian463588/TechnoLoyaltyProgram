/**
 * Prisma Seed Script
 * Populates the database with demo data based on current schema.
 *
 * Run with: npx tsx prisma/seed.ts
 */

import "dotenv/config";
import { PrismaClient, UserRole, DivisionType, MemberTierType, TokenEventType, RedemptionStatus, ClaimStatus, PartnershipStatus } from "@prisma/client";
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

  const leaderTele = await prisma.user.create({
    data: {
      email: "leader.tele@berijalan.id",
      npk: "23457",
      name: "Leader Tele",
      passwordHash,
      role: UserRole.TEAM_LEADER,
      division: DivisionType.TELE,
    },
  });

  const leaderTechno = await prisma.user.create({
    data: {
      email: "leader.techno@berijalan.id",
      npk: "23458",
      name: "Leader Techno",
      passwordHash,
      role: UserRole.TEAM_LEADER,
      division: DivisionType.TECHNO,
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
      teamLeadId: leaderTele.id,
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
      teamLeadId: leaderTechno.id,
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
      teamLeadId: leaderTechno.id,
    },
  });

  const inactiveUser = await prisma.user.create({
    data: {
      email: "inactive@berijalan.id",
      npk: "40005",
      name: "Eve Inactive",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.OPCENT,
      partnerStatus: PartnershipStatus.INACTIVE,
      membershipTier: MemberTierType.SAPHIRE,
      teamLeadId: leaderUser.id,
    },
  });

  const resignedUser = await prisma.user.create({
    data: {
      email: "resigned@berijalan.id",
      npk: "40006",
      name: "Frank Resigned",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.TELE,
      partnerStatus: PartnershipStatus.RESIGNED,
      membershipTier: MemberTierType.RUBY,
      teamLeadId: leaderTele.id,
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
    { userId: alice.id, amount: 5000, event: TokenEventType.EARNED_SHIFT, reason: "Initial balance" },
    { userId: saphireUser.id, amount: 200, event: TokenEventType.EARNED_SHIFT, reason: "Starter tokens" },
    { userId: emeraldUser.id, amount: 800, event: TokenEventType.EARNED_SHIFT, reason: "Mid-tier rewards" },
    { userId: rubyUser.id, amount: 2500, event: TokenEventType.EARNED_PROJECT, reason: "High-tier rewards" },
    { userId: diamondUser.id, amount: 5000, event: TokenEventType.EARNED_PROJECT, reason: "Elite tier rewards" },
    { userId: inactiveUser.id, amount: 500, event: TokenEventType.EARNED_SHIFT, reason: "Old shift rewards" },
    { userId: resignedUser.id, amount: 1200, event: TokenEventType.EARNED_PROJECT, reason: "Last project reward" },
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
    },
    {
      name: "MAP Voucher Rp250.000",
      description: "Voucher belanja MAP senilai Rp250.000.",
      tokenCost: 2500,
      createdBy: adminUser.id,
      isActive: true,
      category: "RUBY",
      stock: 20,
    },
    {
      name: "Berijalan Hoodie",
      description: "Exclusive Emerald Tier hoodie.",
      tokenCost: 1500,
      createdBy: adminUser.id,
      isActive: true,
      category: "EMERALD",
      stock: 30,
    }
  ];

  await prisma.rewardItem.createMany({ data: rewards });

  // ============================================================
  // REDEMPTION REQUEST & PARTNER STATUS CONFIRMATION (TL-01)
  // ============================================================
  console.log("🔄 Adding Redemption Requests and Partner Confirmations...");
  const tumblerReward = await prisma.rewardItem.findFirst({
    where: { name: "Tumbler Premium" },
  });
  const gopayReward = await prisma.rewardItem.findFirst({
    where: { name: "GoPay Voucher Rp100.000" },
  });
  const mapReward = await prisma.rewardItem.findFirst({
    where: { name: "MAP Voucher Rp250.000" },
  });

  if (tumblerReward && gopayReward && mapReward) {
    // 1. Pending Request for Alice
    const redemption1 = await prisma.redemptionRequest.create({
      data: {
        mitraId: alice.id,
        rewardItemId: tumblerReward.id,
        tokenCost: tumblerReward.tokenCost,
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

    await prisma.partnerStatusConfirmation.create({
      data: {
        redemptionRequestId: redemption1.id,
        mitraId: alice.id,
        requestedBy: adminUser.id,
        assignedTo: leaderUser.id,
        status: "PENDING",
      }
    });

    // 2. Completed Request for Alice
    const redemption2 = await prisma.redemptionRequest.create({
      data: {
        mitraId: alice.id,
        rewardItemId: gopayReward.id,
        tokenCost: gopayReward.tokenCost,
        status: RedemptionStatus.COMPLETED,
        completedAt: new Date(),
        history: {
          createMany: {
            data: [
              { previousStatus: RedemptionStatus.DRAFT, newStatus: RedemptionStatus.PENDING_VERIFICATION, changedBy: alice.id },
              { previousStatus: RedemptionStatus.PENDING_VERIFICATION, newStatus: RedemptionStatus.VERIFIED, changedBy: adminUser.id },
              { previousStatus: RedemptionStatus.VERIFIED, newStatus: RedemptionStatus.PURCHASED, changedBy: adminUser.id },
              { previousStatus: RedemptionStatus.PURCHASED, newStatus: RedemptionStatus.COMPLETED, changedBy: adminUser.id },
            ]
          }
        }
      }
    });

    // Deduct tokens for completed redemption
    await prisma.tokenLedger.create({
      data: {
        userId: alice.id,
        eventType: TokenEventType.REDEEMED,
        amount: -gopayReward.tokenCost,
        balanceAfter: 5000 - gopayReward.tokenCost,
        referenceId: redemption2.id,
        performedBy: adminUser.id,
        reason: "Redemption: GoPay Voucher Rp100.000",
      }
    });

    // 3. Rejected Request for Saphire
    await prisma.redemptionRequest.create({
      data: {
        mitraId: saphireUser.id,
        rewardItemId: tumblerReward.id,
        tokenCost: tumblerReward.tokenCost,
        status: RedemptionStatus.REJECTED,
        rejectionReason: "Insufficient slot history validation",
        history: {
          createMany: {
            data: [
              { previousStatus: RedemptionStatus.DRAFT, newStatus: RedemptionStatus.PENDING_VERIFICATION, changedBy: saphireUser.id },
              { previousStatus: RedemptionStatus.PENDING_VERIFICATION, newStatus: RedemptionStatus.REJECTED, changedBy: adminUser.id, note: "Insufficient validation" },
            ]
          }
        }
      }
    });

    // 4. Verified Request for Ruby User
    await prisma.redemptionRequest.create({
      data: {
        mitraId: rubyUser.id,
        rewardItemId: mapReward.id,
        tokenCost: mapReward.tokenCost,
        status: RedemptionStatus.VERIFIED,
        history: {
          createMany: {
            data: [
              { previousStatus: RedemptionStatus.DRAFT, newStatus: RedemptionStatus.PENDING_VERIFICATION, changedBy: rubyUser.id },
              { previousStatus: RedemptionStatus.PENDING_VERIFICATION, newStatus: RedemptionStatus.VERIFIED, changedBy: adminUser.id },
            ]
          }
        }
      }
    });
  }

  // Add an EXPIRED token entry for Alice
  await prisma.tokenLedger.create({
    data: {
      userId: alice.id,
      eventType: TokenEventType.EXPIRED,
      amount: -100,
      balanceAfter: 3900, // Assuming 4000 after gopay
      performedBy: "SYSTEM",
      reason: "Tokens from 2023 expired",
      earnedYear: 2023,
    }
  });

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
