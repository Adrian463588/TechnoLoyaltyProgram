import { NextRequest, NextResponse } from "next/server";
import { RedemptionService } from "@/server/services/redemption.service";
import { updateStatusSchema } from "@/lib/validations";
import { requireRole, getActorId } from "@/lib/auth/guard";

type RedemptionStatusType = import("@prisma/client").$Enums.RedemptionStatus;

// PATCH /api/admin/redemptions/[id] — update status (HC_PM only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth guard ────────────────────────────────────────────
  const sessionOrError = await requireRole("HC_PM");
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const actorId = getActorId(sessionOrError);

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, reason } = parsed.data;

    const updated = await RedemptionService.updateStatus(
      id,
      status as RedemptionStatusType,
      actorId,
      reason
    );

    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
