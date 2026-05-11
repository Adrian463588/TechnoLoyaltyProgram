import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/redemptions — list all requests
export async function GET() {
  try {
    const requests = await prisma.rewardRedemptionRequest.findMany({
      include: {
        user: { select: { id: true, name: true, npk: true } },
        item: { select: { id: true, name: true, tokenCost: true } },
        history: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("[GET /api/admin/redemptions]", error);
    return NextResponse.json({ error: "Failed to fetch redemption requests" }, { status: 500 });
  }
}
