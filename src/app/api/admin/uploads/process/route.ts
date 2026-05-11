import { NextRequest, NextResponse } from "next/server";
import {
  parseOptelCSV,
  parseTechnoCSV,
  buildUploadSummary,
} from "@/server/services/upload.service";
import {
  parseOptelXLSX,
  parseTechnoXLSX,
  detectDivisionFromXLSX,
} from "@/server/services/upload-xlsx.service";
import { requireRole } from "@/lib/auth/guard";

const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
];

const XLSX_EXTENSIONS = [".xlsx", ".xls"];
const CSV_EXTENSIONS  = [".csv", ".tsv"];

function getExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf(".")).toLowerCase();
}

function isXLSX(filename: string, mimeType: string): boolean {
  const ext = getExtension(filename);
  return (
    XLSX_EXTENSIONS.includes(ext) ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  );
}

function isCSV(filename: string): boolean {
  return CSV_EXTENSIONS.includes(getExtension(filename));
}

// POST /api/admin/uploads/process  — HC_PM only
export async function POST(request: NextRequest) {
  // ── Auth guard ──────────────────────────────────────────────
  const sessionOrError = await requireRole("HC_PM");
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  try {
    const formData = await request.formData();
    const file     = formData.get("file")     as File   | null;
    let   division = formData.get("division") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename  = file.name ?? "upload";
    const mimeType  = file.type ?? "";
    const arrayBuf  = await file.arrayBuffer();
    const buffer    = Buffer.from(arrayBuf);

    // ── XLSX path ─────────────────────────────────────────────
    if (isXLSX(filename, mimeType)) {
      // Auto-detect division if not provided
      if (!division || !["OPTEL", "TECHNO"].includes(division.toUpperCase())) {
        const detected = await detectDivisionFromXLSX(buffer);
        if (!detected) {
          return NextResponse.json(
            { error: "Could not determine division from file headers. Please specify division or use the official template." },
            { status: 400 }
          );
        }
        division = detected;
      }

      const divUpper = division.toUpperCase() as "OPTEL" | "TECHNO";
      const result =
        divUpper === "OPTEL"
          ? await parseOptelXLSX(buffer)
          : await parseTechnoXLSX(buffer);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = buildUploadSummary(result as any);

      return NextResponse.json({
        division: divUpper,
        rows:     result.rows,
        issues:   result.issues,
        summary,
      });
    }

    // ── CSV / TSV path ─────────────────────────────────────────
    if (isCSV(filename) || ALLOWED_MIME_TYPES.includes(mimeType)) {
      if (!division || !["OPTEL", "TECHNO"].includes(division.toUpperCase())) {
        return NextResponse.json(
          { error: "Division must be OPTEL or TECHNO for CSV files" },
          { status: 400 }
        );
      }

      const csvText   = new TextDecoder().decode(buffer);
      const divUpper  = division.toUpperCase() as "OPTEL" | "TECHNO";
      const result    =
        divUpper === "OPTEL"
          ? parseOptelCSV(csvText)
          : parseTechnoCSV(csvText);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = buildUploadSummary(result as any);

      return NextResponse.json({
        division: divUpper,
        rows:     result.rows,
        issues:   result.issues,
        summary,
      });
    }

    return NextResponse.json(
      { error: `Unsupported file type: ${mimeType || getExtension(filename)}. Use .xlsx or .csv` },
      { status: 415 }
    );
  } catch (error) {
    console.error("[POST /api/admin/uploads/process]", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
