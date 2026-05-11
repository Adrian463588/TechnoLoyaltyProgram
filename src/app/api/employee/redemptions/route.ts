import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { redeemRequestSchema } from "@/lib/validations";
import { RedemptionService } from "@/server/services/redemption.service";

// GET /api/employee/redemptions — get current user's redemption history
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await prisma.rewardRedemptionRequest.findMany({
      where: { userId: session.user.id },
      include: {
        item: { select: { id: true, name: true, tokenCost: true, imageUrl: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

// POST /api/employee/redemptions — submit a new redemption request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = redeemRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const redemption = await RedemptionService.createRequest(session.user.id, parsed.data.rewardItemId);
    return NextResponse.json(redemption, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to submit request";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
