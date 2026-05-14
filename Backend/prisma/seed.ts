/**
 * Prisma Seed Script
 * Populates the database with demo data based on current schema.
 *
 * Run with: npx tsx prisma/seed.ts
 */

import "dotenv/config";
import { PrismaClient, UserRole, DivisionType, MemberTierType, TokenEventType, RedemptionStatus } from "@prisma/client";
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
  // USERS
  // ============================================================
  
  // Clean existing data to avoid conflicts
  console.log("🗑️ Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.redemptionStatusHistory.deleteMany();
  await prisma.redemptionRequest.deleteMany();
  await prisma.rewardItem.deleteMany();
  await prisma.tokenLedger.deleteMany();
  await prisma.membershipHistory.deleteMany();
  await prisma.shiftClaim.deleteMany();
  await prisma.projectClaim.deleteMany();
  await prisma.user.deleteMany();

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@berijalan.id",
      name: "Admin User",
      passwordHash,
      role: UserRole.HC_ADMIN,
      division: DivisionType.OPCENT,
    },
  });

  const leaderUser = await prisma.user.create({
    data: {
      email: "leader@berijalan.id",
      name: "Leader User",
      passwordHash,
      role: UserRole.TEAM_LEAD,
      division: DivisionType.OPCENT,
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      email: "alice@berijalan.id",
      name: "Alice Optel",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.OPCENT,
      membershipTier: MemberTierType.EMERALD,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      email: "bob@berijalan.id",
      name: "Bob Techno",
      passwordHash,
      role: UserRole.MITRA,
      division: DivisionType.TECHNO,
      membershipTier: MemberTierType.SAPHIRE,
    },
  });

  console.log("✅ Users created: admin@berijalan.id, leader@berijalan.id, alice@berijalan.id, bob@berijalan.id");

  // ============================================================
  // TOKEN LEDGER
  // ============================================================
  await prisma.tokenLedger.createMany({
    data: [
      {
        userId: emp1.id,
        eventType: TokenEventType.EARNED_SHIFT,
        amount: 500,
        balanceAfter: 500,
        performedBy: adminUser.id,
        reason: "Initial shift rewards",
      },
      {
        userId: emp2.id,
        eventType: TokenEventType.EARNED_PROJECT,
        amount: 1000,
        balanceAfter: 1000,
        performedBy: adminUser.id,
        reason: "Initial project rewards",
      }
    ]
  });

  console.log("✅ Token ledger entries created");

  // ============================================================
  // REWARD ITEMS
  // ============================================================
  const rewards = [
    {
      name: "GoPay Voucher Rp100.000",
      description: "Voucher GoPay senilai Rp100.000.",
      tokenCost: 1000,
      createdBy: adminUser.id,
    },
    {
      name: "Tumbler Premium",
      description: "Tumbler branded Berijalan.",
      tokenCost: 500,
      createdBy: adminUser.id,
    }
  ];

  for (const r of rewards) {
    await prisma.rewardItem.create({ data: r });
  }

  console.log("✅ Reward items created");

  // ============================================================
  // SAMPLE REDEMPTION REQUEST
  // ============================================================
  const rewardItem = await prisma.rewardItem.findFirst({
    where: { name: "Tumbler Premium" },
  });

  if (rewardItem) {
    await prisma.redemptionRequest.create({
      data: {
        mitraId: emp1.id,
        rewardItemId: rewardItem.id,
        tokenCost: rewardItem.tokenCost,
        status: RedemptionStatus.PENDING_VERIFICATION,
        history: {
          create: {
            previousStatus: RedemptionStatus.DRAFT,
            newStatus: RedemptionStatus.PENDING_VERIFICATION,
            changedBy: emp1.id,
            note: "Request submitted",
          }
        }
      }
    });
  }

  console.log("✅ Sample redemption request created");

  console.log("\n🎉 Seed complete!");
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
