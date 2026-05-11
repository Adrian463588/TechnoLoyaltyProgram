/**
 * Upload Service — CSV/TSV parsing and validation for both Optel and Techno.
 *
 * SOLID:
 *   - Single Responsibility: Parsing + validation only; DB commits handled by UploadProcessingService
 *   - DRY: Shared types, helpers and summary builder
 *
 * Exports:
 *   parseOptelCSV, parseTechnoCSV, buildUploadSummary   — used by API route
 *   UploadProcessingService                             — used by commit route
 */

import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { optelRowSchema, technoRowSchema } from "@/lib/validations";
import { LoyaltyCalculationService } from "./loyalty-calculation.service";
import { AuditService } from "./audit.service";
import { FileParser } from "@/lib/parser/file-parser";

// ============================================================
// SHARED TYPES
// ============================================================

export interface ValidationIssue {
  rowNumber: number;
  column: string;
  issue: string;
  severity: "ERROR" | "WARNING";
}

export interface ParsedOptelRow {
  rowNumber: number;
  npk: string;
  name: string;
  slots: number;
  regularSlots: number;
  totalSlots: number;
  partnershipStatus: "ACTIVE" | "INACTIVE";
  isResigned: boolean;
  raw: Record<string, string>;
}

export interface ParsedTechnoRow {
  rowNumber: number;
  npk: string;
  name: string;
  monthlySprints: number[];
  totalSprintPerPeriod: number;
  projectRejections: number;
  partnershipStatus: "ACTIVE" | "INACTIVE";
  isResigned: boolean;
  raw: Record<string, string>;
}

export interface ParseResult<T> {
  rows: T[];
  issues: ValidationIssue[];
  validCount: number;
  errorCount: number;
}

export interface UploadSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  hasErrors: boolean;
  hasWarnings: boolean;
  canCommit: boolean;
}

// ============================================================
// OPTEL CSV PARSER
// ============================================================

/**
 * Parses a tab-separated Optel CSV string and validates each row.
 * Accepts tab OR comma delimiters.
 */
export function parseOptelCSV(csvText: string): ParseResult<ParsedOptelRow> {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return {
      rows: [],
      issues: [{ rowNumber: 0, column: "FILE", issue: "File is empty or missing data rows", severity: "ERROR" }],
      validCount: 0,
      errorCount: 0,
    };
  }

  // Auto-detect delimiter
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().toUpperCase());

  const getColIdx = (...names: string[]) =>
    names.reduce<number>((found, n) => (found !== -1 ? found : headers.indexOf(n)), -1);

  const npkIdx   = getColIdx("NPK");
  const nameIdx  = getColIdx("NAME", "NAMA");
  const slotsIdx = getColIdx("SLOTS", "TOTAL SLOT", "SLOT ACCUMULATION");
  const statusIdx = getColIdx("STATUS", "EMPLOYMENT STATUS", "STATUS KEMITRAAN");

  const issues: ValidationIssue[] = [];

  // Validate required headers
  if (npkIdx === -1)
    issues.push({ rowNumber: 0, column: "NPK", issue: "Required column 'NPK' not found", severity: "ERROR" });
  if (nameIdx === -1)
    issues.push({ rowNumber: 0, column: "NAME", issue: "Required column 'NAME' or 'NAMA' not found", severity: "ERROR" });
  if (issues.some((i) => i.severity === "ERROR")) {
    return { rows: [], issues, validCount: 0, errorCount: 0 };
  }

  const rows: ParsedOptelRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    if (cols.every((c) => c === "")) continue; // skip blank lines

    const npk  = npkIdx  !== -1 ? cols[npkIdx]  ?? "" : "";
    const name = nameIdx !== -1 ? cols[nameIdx] ?? "" : "";
    const slotsRaw = slotsIdx !== -1 ? parseFloat(cols[slotsIdx] ?? "0") : 0;
    const slots = isNaN(slotsRaw) ? 0 : slotsRaw;

    const statusRaw = (statusIdx !== -1 ? cols[statusIdx] ?? "" : "").toUpperCase();
    const partnershipStatus: "ACTIVE" | "INACTIVE" =
      statusRaw.includes("AKTIF") || statusRaw === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const isResigned = statusRaw.includes("RESIGN") || statusRaw === "RESIGNED";

    const rowIssues: ValidationIssue[] = [];
    if (!npk)  rowIssues.push({ rowNumber, column: "NPK",  issue: "NPK is required",  severity: "ERROR" });
    if (!name) rowIssues.push({ rowNumber, column: "NAME", issue: "Name is required", severity: "ERROR" });
    if (slots < 0) rowIssues.push({ rowNumber, column: "TOTAL SLOT", issue: "Negative slot value — flagged for review", severity: "WARNING" });

    issues.push(...rowIssues);

    if (!rowIssues.some((ri) => ri.severity === "ERROR")) {
      rows.push({
        rowNumber,
        npk,
        name,
        slots,
        regularSlots: slots,
        totalSlots: slots,
        partnershipStatus,
        isResigned,
        raw: Object.fromEntries(headers.map((h, idx) => [h, cols[idx] ?? ""])),
      });
    }
  }

  const errorCount = issues.filter((i) => i.severity === "ERROR").length;
  return { rows, issues, validCount: rows.length, errorCount };
}

// ============================================================
// TECHNO CSV PARSER
// ============================================================

export function parseTechnoCSV(csvText: string): ParseResult<ParsedTechnoRow> {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return {
      rows: [],
      issues: [{ rowNumber: 0, column: "FILE", issue: "File is empty or missing data rows", severity: "ERROR" }],
      validCount: 0,
      errorCount: 0,
    };
  }

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().toUpperCase());

  const getColIdx = (...names: string[]) =>
    names.reduce<number>((found, n) => (found !== -1 ? found : headers.indexOf(n)), -1);

  const npkIdx      = getColIdx("NPK");
  const nameIdx     = getColIdx("NAME", "NAMA");
  const sprintIdx   = getColIdx("SPRINTS", "TOTAL SPRINT", "SPRINT BALANCE");
  const rejectIdx   = getColIdx("PROJECT REJECTIONS", "TOTAL PENOLAKAN PROJECT");
  const statusIdx   = getColIdx("STATUS", "EMPLOYMENT STATUS");

  const issues: ValidationIssue[] = [];

  if (npkIdx === -1)
    issues.push({ rowNumber: 0, column: "NPK",  issue: "Required column 'NPK' not found",  severity: "ERROR" });
  if (nameIdx === -1)
    issues.push({ rowNumber: 0, column: "NAME", issue: "Required column 'NAME' or 'NAMA' not found", severity: "ERROR" });
  if (issues.some((i) => i.severity === "ERROR")) {
    return { rows: [], issues, validCount: 0, errorCount: 0 };
  }

  const rows: ParsedTechnoRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    if (cols.every((c) => c === "")) continue;

    const npk  = cols[npkIdx]  ?? "";
    const name = cols[nameIdx] ?? "";
    const sprintRaw   = sprintIdx !== -1 ? parseFloat(cols[sprintIdx] ?? "0") : 0;
    const rejectRaw   = rejectIdx !== -1 ? parseFloat(cols[rejectIdx] ?? "0") : 0;
    const sprints     = isNaN(sprintRaw) ? 0 : sprintRaw;
    const rejections  = isNaN(rejectRaw) ? 0 : Math.max(0, rejectRaw);

    const statusRaw = (statusIdx !== -1 ? cols[statusIdx] ?? "" : "").toUpperCase();
    const partnershipStatus: "ACTIVE" | "INACTIVE" =
      statusRaw.includes("AKTIF") || statusRaw === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const isResigned = statusRaw.includes("RESIGN") || statusRaw === "RESIGNED";

    const rowIssues: ValidationIssue[] = [];
    if (!npk)  rowIssues.push({ rowNumber, column: "NPK",  issue: "NPK is required",  severity: "ERROR" });
    if (!name) rowIssues.push({ rowNumber, column: "NAME", issue: "Name is required", severity: "ERROR" });

    issues.push(...rowIssues);

    if (!rowIssues.some((ri) => ri.severity === "ERROR")) {
      rows.push({
        rowNumber,
        npk,
        name,
        monthlySprints: [sprints],
        totalSprintPerPeriod: sprints,
        projectRejections: rejections,
        partnershipStatus,
        isResigned,
        raw: Object.fromEntries(headers.map((h, idx) => [h, cols[idx] ?? ""])),
      });
    }
  }

  const errorCount = issues.filter((i) => i.severity === "ERROR").length;
  return { rows, issues, validCount: rows.length, errorCount };
}

// ============================================================
// UPLOAD SUMMARY BUILDER
// ============================================================

export function buildUploadSummary(result: {
  rows: Array<{ rowNumber: number }>;
  issues: ValidationIssue[];
  validCount: number;
  errorCount: number;
}): UploadSummary {
  const { validCount, errorCount, issues } = result;
  const warningRows = issues.filter((i) => i.severity === "WARNING").length;
  const totalRows   = validCount + errorCount;

  return {
    totalRows,
    validRows:   validCount,
    errorRows:   errorCount,
    warningRows,
    hasErrors:   errorCount > 0,
    hasWarnings: warningRows > 0,
    canCommit:   errorCount === 0,
  };
}

// ============================================================
// UPLOAD PROCESSING SERVICE (DB write — Phase 1–3)
// ============================================================

export class UploadProcessingService {
  /**
   * Phase 1: Ingest and Stage
   * Creates MonthlyUpload + UploadBatch + UploadRowStaging records.
   */
  static async stageFile(
    filename: string,
    fileBuffer: Buffer,
    divisionType: "OPTEL" | "TECHNO",
    actorId: string
  ) {
    let rawRows: Record<string, unknown>[];
    try {
      rawRows = FileParser.parseBuffer(fileBuffer, filename);
    } catch (error: unknown) {
      throw new Error(`Failed to parse file: ${(error as Error).message}`);
    }

    if (rawRows.length === 0) {
      throw new Error("File is empty or could not be parsed.");
    }

    // Schema: MonthlyUpload has filename, divisionType, status, uploadedById
    const upload = await prisma.monthlyUpload.create({
      data: {
        filename,
        divisionType,
        status: "STAGED",
        uploadedById: actorId,
      },
    });

    // Schema: UploadBatch links to MonthlyUpload
    const batch = await prisma.uploadBatch.create({
      data: {
        uploadId: upload.id,
        totalRows: rawRows.length,
      },
    });

    // Schema: UploadRowStaging links to UploadBatch via batchId (required)
    await prisma.uploadRowStaging.createMany({
      data: rawRows.map((row, index) => ({
        batchId: batch.id,
        rowNumber: index + 1,
        rawData: row as import("@prisma/client").Prisma.InputJsonValue,
        isValid: false,
      })),
    });

    await AuditService.log({
      action: "UPLOAD_STAGED",
      actorId,
      targetType: "MonthlyUpload",
      targetId: upload.id,
      details: { filename, rowCount: rawRows.length, divisionType },
    });

    return { upload, batch };
  }

  /**
   * Phase 2: Validate Staged Rows
   * Reads rows from UploadBatch and validates via Zod schema.
   * Issues are stored in UploadValidationIssue (separate model).
   */
  static async validateStagedUpload(uploadId: string) {
    const upload = await prisma.monthlyUpload.findUnique({
      where: { id: uploadId },
      include: {
        batches: {
          include: { stagingRows: true },
        },
      },
    });

    if (!upload) throw new Error("Upload not found");

    await prisma.monthlyUpload.update({
      where: { id: uploadId },
      data: { status: "VALIDATING" },
    });

    const schema = upload.divisionType === "OPTEL" ? optelRowSchema : technoRowSchema;
    let totalErrors = 0;

    const stagingRows = upload.batches.flatMap((b) => b.stagingRows);

    await Promise.all(
      stagingRows.map(async (row) => {
        const parsed = schema.safeParse(row.rawData);
        await prisma.uploadRowStaging.update({
          where: { id: row.id },
          data: { isValid: parsed.success },
        });

        if (!parsed.success) {
          totalErrors++;
          // Store individual issues in UploadValidationIssue
          await prisma.uploadValidationIssue.createMany({
            data: parsed.error.issues.map((issue) => ({
              rowId: row.id,
              column: issue.path.join(".") || "unknown",
              issue: issue.message,
              severity: "ERROR",
            })),
          });
        }
      })
    );

    return { uploadId, totalRows: stagingRows.length, totalErrors };
  }

  /**
   * Phase 3: Commit Validated Rows
   * Processes each valid staging row through LoyaltyCalculationService.
   */
  static async commitUpload(uploadId: string, actorId: string) {
    const upload = await prisma.monthlyUpload.findUnique({
      where: { id: uploadId },
      include: {
        batches: {
          include: {
            stagingRows: { where: { isValid: true } },
          },
        },
      },
    });

    if (!upload) throw new Error("Upload not found");
    if (upload.status === "COMPLETED") throw new Error("Upload is already completed");

    await prisma.monthlyUpload.update({
      where: { id: uploadId },
      data: { status: "PROCESSING" },
    });

    const validRows = upload.batches.flatMap((b) => b.stagingRows);

    // Determine the active period for this upload
    const activePeriod = await prisma.earningPeriod.findFirst({
      where: { isActive: true },
    });
    const periodId = activePeriod?.id ?? "";

    let successCount = 0;
    let failureCount = 0;

    for (const row of validRows) {
      try {
        const rawData = row.rawData as Record<string, unknown>;

        const user = await prisma.user.upsert({
          where: { npk: String(rawData.npk) },
          create: {
            npk: String(rawData.npk),
            name: String(rawData.name ?? "Unknown"),
            role: "MITRA",
            email: `${rawData.npk}@example.com`,
            passwordHash: "hashed_placeholder",
          },
          update: { name: rawData.name ? String(rawData.name) : undefined },
        });

        await LoyaltyCalculationService.issueTokensForPeriod(
          user.id,
          periodId,
          upload.divisionType as "OPTEL" | "TECHNO",
          rawData as Record<string, number | string>,
          actorId,
          row.id // sourceId for ledger
        );

        successCount++;
      } catch (err) {
        console.error(`Failed to process row ${row.id}`, err);
        failureCount++;
      }
    }

    await prisma.monthlyUpload.update({
      where: { id: uploadId },
      data: { status: "COMPLETED" },
    });

    await AuditService.log({
      action: "UPLOAD_COMMITTED",
      actorId,
      targetType: "MonthlyUpload",
      targetId: upload.id,
      details: { successCount, failureCount },
    });

    return { successCount, failureCount };
  }
}
