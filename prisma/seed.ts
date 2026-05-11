/**
 * Prisma Seed Script
 * Populates the database with demo data for all three user roles.
 *
 * Run with: npx tsx prisma/seed.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================================
  // DIVISIONS
  // ============================================================
  const optel = await prisma.division.upsert({
    where: { name: "Optel" },
    update: {},
    create: { name: "Optel", type: "OPTEL" },
  });

  const techno = await prisma.division.upsert({
    where: { name: "Techno" },
    update: {},
    create: { name: "Techno", type: "TECHNO" },
  });

  console.log("✅ Divisions created");

  // ============================================================
  // TEAMS
  // ============================================================
  const optelTeam = await prisma.team.upsert({
    where: { id: "team-optel-1" },
    update: {},
    create: { id: "team-optel-1", name: "Optel Alpha", divisionId: optel.id },
  });

  const technoTeam = await prisma.team.upsert({
    where: { id: "team-techno-1" },
    update: {},
    create: { id: "team-techno-1", name: "Techno Beta", divisionId: techno.id },
  });

  console.log("✅ Teams created");

  // ============================================================
  // PASSWORD HASH
  // ============================================================
  const passwordHash = await bcrypt.hash("password123", 10);

  // ============================================================
  // USERS
  // ============================================================
  const adminUser = await prisma.user.upsert({
    where: { npk: "ADM001" },
    update: {},
    create: {
      npk: "ADM001",
      name: "Admin User",
      email: "admin@berijalan.id",
      passwordHash,
      role: "HC_PM",
      isActive: true,
    },
  });

  const leaderUser = await prisma.user.upsert({
    where: { npk: "LDR001" },
    update: {},
    create: {
      npk: "LDR001",
      name: "Leader User",
      email: "leader@berijalan.id",
      passwordHash,
      role: "TEAM_LEADER",
      divisionId: optel.id,
      teamId: optelTeam.id,
      isActive: true,
    },
  });

  const emp1 = await prisma.user.upsert({
    where: { npk: "EMP001" },
    update: {},
    create: {
      npk: "EMP001",
      name: "Alice Optel",
      email: "alice@berijalan.id",
      passwordHash,
      role: "MITRA",
      divisionId: optel.id,
      teamId: optelTeam.id,
      isActive: true,
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { npk: "EMP002" },
    update: {},
    create: {
      npk: "EMP002",
      name: "Bob Techno",
      email: "bob@berijalan.id",
      passwordHash,
      role: "MITRA",
      divisionId: techno.id,
      teamId: technoTeam.id,
      isActive: true,
    },
  });

  const emp3 = await prisma.user.upsert({
    where: { npk: "EMP003" },
    update: {},
    create: {
      npk: "EMP003",
      name: "Diana Techno",
      email: "diana@berijalan.id",
      passwordHash,
      role: "MITRA",
      divisionId: techno.id,
      teamId: technoTeam.id,
      isActive: true,
    },
  });

  console.log("✅ Users created (ADM001, LDR001, EMP001, EMP002, EMP003)");
  console.log("   Password for all accounts: password123");

  // ============================================================
  // EARNING PERIOD
  // ============================================================
  const period = await prisma.earningPeriod.upsert({
    where: { name: "P1-2026" },
    update: {},
    create: {
      name: "P1-2026",
      startDate: new Date("2025-12-16"),
      endDate: new Date("2026-06-15"),
      isActive: true,
    },
  });

  console.log("✅ Earning period P1-2026 created");

  // ============================================================
  // TOKEN LEDGER ENTRIES
  // ============================================================
  await prisma.tokenLedgerEntry.deleteMany({
    where: { userId: { in: [emp1.id, emp2.id, emp3.id] } },
  });

  await prisma.tokenLedgerEntry.createMany({
    data: [
      // Alice Optel — Gold tier (4500 tokens)
      { userId: emp1.id, periodId: period.id, sourceType: "UPLOAD_OPTEL", amount: 3000 },
      { userId: emp1.id, periodId: period.id, sourceType: "UPLOAD_OPTEL", amount: 1000 },
      { userId: emp1.id, periodId: period.id, sourceType: "UPLOAD_OPTEL", amount: 500  },

      // Bob Techno — Bronze (1200 tokens)
      { userId: emp2.id, periodId: period.id, sourceType: "UPLOAD_TECHNO", amount: 1200 },

      // Diana Techno — Platinum (8500 tokens)
      { userId: emp3.id, periodId: period.id, sourceType: "UPLOAD_TECHNO", amount: 4000 },
      { userId: emp3.id, periodId: period.id, sourceType: "UPLOAD_TECHNO", amount: 2500 },
      { userId: emp3.id, periodId: period.id, sourceType: "UPLOAD_TECHNO", amount: 2000 },
    ],
  });

  console.log("✅ Token ledger entries created");

  // ============================================================
  // USER LOYALTY PROFILES AND METRICS
  // ============================================================
  await prisma.userDivisionMetric.deleteMany();
  await prisma.userLoyaltyProfile.deleteMany({
    where: { userId: { in: [emp1.id, emp2.id, emp3.id] } },
  });

  const p1 = await prisma.userLoyaltyProfile.create({
    data: {
      userId: emp1.id,
      currentTier: "GOLD",
      totalTokens: 4500,
      remainingTokens: 3500,
      isEligible: true,
      metrics: {
        create: { divisionType: "OPTEL", totalSlots: 20 }
      }
    }
  });

  const p2 = await prisma.userLoyaltyProfile.create({
    data: {
      userId: emp2.id,
      currentTier: "BRONZE",
      totalTokens: 1200,
      remainingTokens: 1200,
      isEligible: false,
      metrics: {
        create: { divisionType: "TECHNO", sprintBalance: 5, projectRejections: 3 }
      }
    }
  });

  const p3 = await prisma.userLoyaltyProfile.create({
    data: {
      userId: emp3.id,
      currentTier: "PLATINUM",
      totalTokens: 8500,
      remainingTokens: 8500,
      isEligible: true,
      metrics: {
        create: { divisionType: "TECHNO", sprintBalance: 40, projectRejections: 0 }
      }
    }
  });

  console.log("✅ User loyalty profiles and metrics created");

  // ============================================================
  // REWARD ITEMS
  // ============================================================
  const rewards = [
    {
      name: "GoPay Voucher Rp100.000",
      description: "Voucher GoPay senilai Rp100.000 untuk berbagai transaksi.",
      tokenCost: 1000,
      isAvailable: true,
    },
    {
      name: "GoPay Voucher Rp250.000",
      description: "Voucher GoPay senilai Rp250.000.",
      tokenCost: 2500,
      isAvailable: true,
    },
    {
      name: "Berijalan Tumbler Premium",
      description: "Tumbler stainless steel branded Berijalan edisi khusus.",
      tokenCost: 1500,
      isAvailable: true,
    },
    {
      name: "Team Lunch Voucher",
      description: "Makan siang tim di restoran pilihan, maks 5 orang.",
      tokenCost: 5000,
      isAvailable: true,
    },
    {
      name: "Extra Day Off",
      description: "Satu hari cuti tambahan di luar kuota tahunan.",
      tokenCost: 10000,
      isAvailable: false,
    },
  ];

  for (const r of rewards) {
    const existing = await prisma.rewardItem.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.rewardItem.create({ data: r });
    }
  }

  console.log("✅ Reward items created");

  // ============================================================
  // SAMPLE REDEMPTION REQUEST
  // ============================================================
  const rewardItem = await prisma.rewardItem.findFirst({
    where: { name: "GoPay Voucher Rp100.000" },
  });

  if (rewardItem) {
    const existingReq = await prisma.rewardRedemptionRequest.findFirst({
      where: { userId: emp1.id, rewardItemId: rewardItem.id },
    });

    if (!existingReq) {
      await prisma.rewardRedemptionRequest.create({
        data: {
          userId: emp1.id,
          rewardItemId: rewardItem.id,
          tokensSpent: rewardItem.tokenCost,
          status: "PENDING_VERIFICATION",
          history: {
            create: {
              toStatus: "PENDING_VERIFICATION",
              actorId: emp1.id,
              reason: "Employee submitted redemption request.",
            },
          },
        },
      });
    }
  }

  console.log("✅ Sample redemption request created");

  // ============================================================
  // SAMPLE AUDIT LOG
  // ============================================================
  await prisma.auditLog.create({
    data: {
      action: "MANUAL_TOKEN_ADJUSTMENT",
      actorId: adminUser.id,
      targetType: "System",
      targetId: "system",
      details: { note: "Initial database seed completed" },
    },
  });

  console.log("\n🎉 Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Demo accounts (password: password123)");
  console.log("  Employee : NPK=EMP001  → /employee/dashboard");
  console.log("  Leader   : NPK=LDR001  → /leader/team");
  console.log("  Admin    : NPK=ADM001  → /admin/dashboard");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
