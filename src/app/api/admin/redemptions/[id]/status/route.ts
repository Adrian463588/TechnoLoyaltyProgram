import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { updateStatusSchema } from "@/lib/validations";
import { RedemptionService } from "@/server/services/redemption.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "HC_PM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await RedemptionService.updateStatus(
      id,
      parsed.data.status,
      session.user.id!,
      parsed.data.reason
    );

    return NextResponse.json({
      success: true,
      message: `Status updated to ${parsed.data.status}`,
      request: result,
    });
  } catch (error: any) {
    console.error("Redemption Status Update Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
