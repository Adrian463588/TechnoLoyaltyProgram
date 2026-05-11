import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { UploadProcessingService } from "@/server/services/upload.service";

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

    const result = await UploadProcessingService.commitUpload(id, session.user.id!);

    return NextResponse.json({
      success: true,
      message: "Upload committed successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Upload Commit Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to commit upload" },
      { status: 500 }
    );
  }
}
