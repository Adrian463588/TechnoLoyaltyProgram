import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { uploadMetaSchema } from "@/lib/validations";
import { UploadProcessingService } from "@/server/services/upload.service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "HC_PM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const divisionType = formData.get("divisionType") as string;
    const periodId = formData.get("periodId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const metaParsed = uploadMetaSchema.safeParse({
      filename: file.name,
      divisionType,
      periodId,
    });

    if (!metaParsed.success) {
      return NextResponse.json(
        { error: "Invalid metadata", details: metaParsed.error.flatten() },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { upload } = await UploadProcessingService.stageFile(
      file.name,
      buffer,
      metaParsed.data.divisionType,
      session.user.id!
    );

    // Automatically trigger validation after staging for better UX
    await UploadProcessingService.validateStagedUpload(upload.id);

    return NextResponse.json({ success: true, uploadId: upload.id });
  } catch (error: any) {
    console.error("Upload Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process upload" },
      { status: 500 }
    );
  }
}
