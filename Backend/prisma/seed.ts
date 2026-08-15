/**
 * Prisma Seed Script
 * Populates the database with demo data based on current schema.
 * Production safe: Uses upsert instead of create/delete, skips dummy data in production.
 * Passwords are supplied through environment variables and are never stored in source.
 *
 * Run with: npm run prisma:seed
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
  const isProd = process.env.NODE_ENV === "production";
  console.log(`🌱 Seeding database... (Environment: ${process.env.NODE_ENV || 'development'})`);

  const seedPassword = isProd
    ? process.env.SEED_ADMIN_PASSWORD
    : process.env.DEMO_PASSWORD;
  if (!seedPassword) {
    throw new Error(
      isProd
        ? "SEED_ADMIN_PASSWORD is required for a production seed"
        : "DEMO_PASSWORD is required for a development/test seed",
    );
  }
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  // ============================================================
  // SYSTEM ADMIN (Always seeded/verified)
  // ============================================================
  console.log("👥 Upserting System Admin...");
  const adminUser = await prisma.user.upsert({
    where: { npk: "12345" },
    update: {},
    create: {
      email: "admin@berijalan.id",
      npk: "12345",
      name: "Admin User",
      passwordHash,
      role: UserRole.HC_PM,
      division: DivisionType.OPCENT,
    },
  });

  if (isProd) {
    console.log("✅ Production seed complete. Only system admin was verified.");
    return;
  }

  // ============================================================
  // DEV/TEST DATA (Skipped in production)
  // ============================================================
  console.log("⚠️ Development mode detected. Upserting mock data...");

  const leaderUser = await prisma.user.upsert({
    where: { npk: "23456" },
    update: {},
    create: {
      email: "leader@berijalan.id",
      npk: "23456",
      name: "Leader User",
      passwordHash,
      role: UserRole.TEAM_LEADER,
      division: DivisionType.OPCENT,
    },
  });

  const leaderTele = await prisma.user.upsert({
    where: { npk: "23457" },
    update: {},
    create: {
      email: "leader.tele@berijalan.id",
      npk: "23457",
      name: "Leader Tele",
      passwordHash,
      role: UserRole.TEAM_LEADER,
      division: DivisionType.TELE,
    },
  });

  const leaderTechno = await prisma.user.upsert({
    where: { npk: "23458" },
    update: {},
    create: {
      email: "leader.techno@berijalan.id",
      npk: "23458",
      name: "Leader Techno",
      passwordHash,
      role: UserRole.TEAM_LEADER,
      division: DivisionType.TECHNO,
    },
  });

  // Create Mitras
  const alice = await prisma.user.upsert({
    where: { npk: "34567" },
    update: {},
    create: {
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

  const saphireUser = await prisma.user.upsert({
    where: { npk: "40001" },
    update: {},
    create: {
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

  const emeraldUser = await prisma.user.upsert({
    where: { npk: "40002" },
    update: {},
    create: {
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

  const rubyUser = await prisma.user.upsert({
    where: { npk: "40003" },
    update: {},
    create: {
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

  const diamondUser = await prisma.user.upsert({
    where: { npk: "40004" },
    update: {},
    create: {
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

  const inactiveUser = await prisma.user.upsert({
    where: { npk: "40005" },
    update: {},
    create: {
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

  const resignedUser = await prisma.user.upsert({
    where: { npk: "40006" },
    update: {},
    create: {
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

  console.log("✅ Users upserted and hierarchy established.");

  // ============================================================
  // REWARD ITEMS
  // ============================================================
  console.log("🎁 Upserting Reward Items...");
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

  for (const reward of rewards) {
    // Check by name manually (assuming name is unique enough for seed, as there is no unique constraint on name)
    const existing = await prisma.rewardItem.findFirst({ where: { name: reward.name } });
    if (!existing) {
      await prisma.rewardItem.create({ data: reward });
    }
  }

  // To keep the seeder strictly idempotent without risking duplicate data logic,
  // we skip re-inserting ledgers/claims/history on subsequent runs if users already have tokens
  const aliceLedgerCount = await prisma.tokenLedger.count({ where: { userId: alice.id } });
  
  if (aliceLedgerCount === 0) {
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

    // Add an EXPIRED token entry for Alice
    await prisma.tokenLedger.create({
      data: {
        userId: alice.id,
        eventType: TokenEventType.EXPIRED,
        amount: -100,
        balanceAfter: 3900,
        performedBy: "SYSTEM",
        reason: "Tokens from 2023 expired",
        earnedYear: 2023,
      }
    });

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
  } else {
    console.log("⏭️ Mock transactions already exist. Skipping duplicate insertion.");
  }

  console.log("\n🎉 Seed complete! Idempotent rules applied.");
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
