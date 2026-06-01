import { prisma } from "@/db/prisma";
import { RedemptionStatus } from "@prisma/client";

/**
 * ChatbotService
 * Provides functions for Gemini AI to interact with the PostgreSQL database via Prisma.
 */
export class ChatbotService {
  /**
   * 1. Kategori: Akun & Personal
   */

  /**
   * Mengambil ringkasan akun user (saldo token, tier, dll)
   * @param npk NPK user dari session
   */
  async getUserSummary(npk: string) {
    const user = await prisma.user.findUnique({
      where: { npk },
      select: {
        npk: true,
        name: true,
        membershipTier: true,
        division: true,
        partnerStatus: true,
        joinedAt: true,
        // Calculate current tokens from ledger for accuracy
        tokenLedger: {
            select: {
                amount: true
            }
        }
      }
    });

    if (!user) return null;

    // Sum up the tokens from ledger
    const totalTokens = user.tokenLedger.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      npk: user.npk,
      name: user.name,
      tier: user.membershipTier,
      division: user.division,
      status: user.partnerStatus,
      currentTokens: totalTokens,
      joinedAt: user.joinedAt
    };
  }

  /**
   * Mengambil riwayat penukaran hadiah terakhir
   * @param npk NPK user
   * @param limit Jumlah riwayat yang diambil
   */
  async getRedemptionHistory(npk: string, limit: number = 5) {
    const user = await prisma.user.findUnique({
        where: { npk },
        select: { id: true }
    });

    if (!user) return [];

    const redemptions = await prisma.redemptionRequest.findMany({
      where: { mitraId: user.id },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        rewardItem: {
          select: {
            name: true,
            tokenCost: true
          }
        }
      }
    });

    return redemptions.map(r => ({
      id: r.id,
      rewardName: r.rewardItem.name,
      tokenCost: r.tokenCost,
      status: r.status,
      submittedAt: r.submittedAt,
      completedAt: r.completedAt
    }));
  }

  /**
   * 2. Kategori: Katalog Hadiah
   */

  /**
   * Mencari hadiah berdasarkan budget atau kategori
   */
  async getRewardCatalog(maxPrice?: number, category?: string) {
    const rewards = await prisma.rewardItem.findMany({
      where: {
        isActive: true,
        ...(maxPrice ? { tokenCost: { lte: maxPrice } } : {}),
        ...(category ? { category: { contains: category, mode: 'insensitive' } } : {})
      },
      orderBy: { tokenCost: 'asc' }
    });

    return rewards.map(r => ({
      name: r.name,
      tokenCost: r.tokenCost,
      category: r.category,
      stock: r.stock ?? "Unlimited",
      minTier: r.minTier
    }));
  }

  /**
   * Mengecek detail hadiah spesifik
   */
  async getRewardDetail(rewardName: string) {
    const reward = await prisma.rewardItem.findFirst({
      where: {
        name: { contains: rewardName, mode: 'insensitive' },
        isActive: true
      }
    });

    if (!reward) return null;

    return {
      name: reward.name,
      description: reward.description,
      tokenCost: reward.tokenCost,
      stock: reward.stock ?? "Unlimited",
      minTier: reward.minTier
    };
  }

  /**
   * 3. Kategori: Team Leader
   */

  /**
   * Mengambil statistik ringkas tim dalam satu divisi
   */
  async getTeamOverview(division: string) {
    const team = await prisma.user.findMany({
      where: { 
        division: division as any,
        role: "MITRA"
      },
      select: {
        tokenLedger: { select: { amount: true } }
      }
    });

    const totalTeamTokens = team.reduce((acc, user) => {
        return acc + user.tokenLedger.reduce((sum, l) => sum + l.amount, 0);
    }, 0);

    return {
      division,
      memberCount: team.length,
      totalTeamTokens,
      averageTokens: team.length > 0 ? Math.round(totalTeamTokens / team.length) : 0
    };
  }

  /**
   * 4. Kategori: Admin (HC_PM)
   */

  /**
   * Mengambil peringkat token (Leaderboard)
   * @param limit Jumlah user yang diambil
   * @param division Filter berdasarkan divisi (opsional)
   */
  async getTokenLeaderboard(limit: number = 10, division?: string) {
    const users = await prisma.user.findMany({
      where: {
        role: "MITRA",
        ...(division ? { division: division as any } : {})
      },
      select: {
        name: true,
        npk: true,
        division: true,
        membershipTier: true,
        tokenLedger: {
          select: { amount: true }
        }
      }
    });

    // Calculate totals and sort
    const leaderboard = users.map(u => ({
      name: u.name,
      npk: u.npk,
      division: u.division,
      tier: u.membershipTier,
      totalTokens: u.tokenLedger.reduce((sum, entry) => sum + entry.amount, 0)
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, limit);

    return leaderboard;
  }

  /**
   * Menghitung aksi yang tertunda secara global
   */
  async getGlobalPendingActions() {
    const [pendingRedemptions, pendingClaims] = await Promise.all([
      prisma.redemptionRequest.count({ where: { status: "REQUESTED" } }),
      prisma.shiftClaim.count({ where: { status: "PENDING" } })
    ]);

    return {
      pendingRedemptions,
      pendingClaims,
      totalActions: pendingRedemptions + pendingClaims
    };
  }
}

export const chatbotService = new ChatbotService();
