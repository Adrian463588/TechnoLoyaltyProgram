import { asyncHandler } from "@/middleware/asyncHandler";
import multer, { type FileFilterCallback } from "multer";
import * as XLSX from "xlsx";
import { ValidationError } from "@/errors";
import { uploadProcessingService } from "@/services/upload-processing.service";
import { aiColumnMapperService } from "@/services/ai-column-mapper.service";
import { adminFoundationService } from "@/services/admin-foundation.service";
import type { DivisionType, PartnershipStatus } from "@prisma/client";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const allowed = new Set([
      "text/csv",
      "text/tab-separated-values",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]);
    if (!allowed.has(file.mimetype)) {
      cb(new ValidationError("Unsupported upload MIME type"));
      return;
    }
    cb(null, true);
  },
});

type UploadRow = Record<string, string | number | boolean | null>;

function readRows(file: Express.Multer.File): UploadRow[] {
  const isExcel = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
  ].includes(file.mimetype) || 
  file.originalname.toLowerCase().endsWith(".xlsx") || 
  file.originalname.toLowerCase().endsWith(".xls");

  if (isExcel) {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return [];
    
    // Convert to array of arrays to find the header row dynamically
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
    
    // Find the row index that contains "NPK" or common variants
    const npkKeywords = ["npk", "no. induk", "no induk", "employee id", "nip", "no_induk", "nomor induk", "no.induk"];
    let headerRowIndex = data.findIndex((row, _idx) => {
      const hasNpk = row.some((cell: any) => {
        const val = String(cell).toLowerCase().trim();
        return npkKeywords.some(k => val === k || val.includes(k));
      });
      return hasNpk;
    });
    
    // Fallback to row 0 if NPK not found
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    // Merge multi-line headers if the next row also looks like a header (e.g. contains months)
    const headerRow = data[headerRowIndex];
    if (!headerRow) return [];
    let headers = headerRow.map(h => String(h).trim());
    const nextRow = data[headerRowIndex + 1];
    const monthKeywords = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "ags", "sep", "okt", "nov", "des"];
    if (nextRow && nextRow.some(cell => monthKeywords.some(m => String(cell).toLowerCase().includes(m)))) {
      headers = headers.map((h, i) => {
        const secondary = String(nextRow[i] || "").trim();
        if (!h) return secondary;
        if (!secondary) return h;
        return `${h}_${secondary}`;
      });
      headerRowIndex++; // Skip the secondary header row too
    }

    const rows = data.slice(headerRowIndex + 1).map(row => {
      const obj: UploadRow = {};
      headers.forEach((h, i) => {
        if (h) {
          const val = row[i];
          obj[h] = (val === undefined || val === "") ? null : val;
        }
      });
      return obj;
    });

    return rows.filter(row => Object.values(row).some(v => v !== null && v !== ""));
  }

  const text = file.buffer.toString("utf8");
  const delimiter = text.includes("\t") ? "\t" : ",";
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Find header line index (containing npk or common variants)
  const npkKeywords = ["npk", "no. induk", "no induk", "employee id", "nip", "no_induk", "nomor induk"];
  let headerLineIndex = lines.findIndex(line => 
    npkKeywords.some(k => line.toLowerCase().includes(k))
  );
  if (headerLineIndex === -1) headerLineIndex = 0;

  const headerLine = lines[headerLineIndex];
  if (!headerLine) return [];
  const headers = headerLine.split(delimiter).map(h => h.trim());
  const dataLines = lines.slice(headerLineIndex + 1);

  return dataLines.map((line) => {
    const values = line.split(delimiter);
    return headers.reduce<UploadRow>((row, header, index) => {
      const val = values[index]?.trim();
      row[header] = (val === undefined || val === "") ? null : val;
      return row;
    }, {});
  }).filter(row => Object.values(row).some(v => v !== null && v !== ""));
}

function sourceUnitValue(row: UploadRow, division?: string): number | null {
  const keys = division === "TECHNO"
    ? ["sourceUnits", "completedProjects", "completed_projects", "projects", "sprints"]
    : ["sourceUnits", "slots", "slotCount", "total_slot", "total_slot_reguler", "accumulated_slots"];
  const key = keys.find((candidate) => row[candidate] !== null && row[candidate] !== undefined && row[candidate] !== "");
  if (!key) return null;
  const value = Number(row[key]);
  return Number.isInteger(value) && value >= 0 ? value : Number.NaN;
}

function validateRows(rows: UploadRow[], division?: string): Array<{
  rowNumber: number;
  column: string;
  issue: string;
  severity: "ERROR" | "WARNING";
}> {
  return rows.flatMap((row, index) => {
    const issues: Array<{
      rowNumber: number;
      column: string;
      issue: string;
      severity: "ERROR" | "WARNING";
    }> = [];

    // Required fields: NPK, Nama, Fungsi, source contribution, membership tier.
    const npk = row["npk"];
    const name = row["name"] || row["nama"];
    const fungsi = row["fungsi"];
    const tier = row["jenis_membership"];

    if (!npk) {
      issues.push({ rowNumber: index + 1, column: "NPK", issue: "NPK is required", severity: "ERROR" });
    }
    if (!name) {
      issues.push({ rowNumber: index + 1, column: "Nama", issue: "Name is required", severity: "ERROR" });
    }
    if (!fungsi) {
      issues.push({ rowNumber: index + 1, column: "Fungsi", issue: "Fungsi is required", severity: "ERROR" });
    }
    const sourceUnits = sourceUnitValue(row, division);
    if (sourceUnits === null) {
      issues.push({
        rowNumber: index + 1,
        column: division === "TECHNO" ? "Completed Projects" : "Slots",
        issue: "A validated source contribution is required; target token balance is not accepted.",
        severity: "ERROR",
      });
    } else if (Number.isNaN(sourceUnits)) {
      issues.push({
        rowNumber: index + 1,
        column: division === "TECHNO" ? "Completed Projects" : "Slots",
        issue: "Source contribution must be a non-negative integer.",
        severity: "ERROR",
      });
    }
    if (!tier) {
      issues.push({ rowNumber: index + 1, column: "Jenis Membership", issue: "Jenis Membership is required", severity: "ERROR" });
    }

    return issues;
  });
}

export const uploadProcessMiddleware = upload.single("file");

export const AdminFoundationController = {
  listAuditLogs: asyncHandler(async (req, res) => {
      const limit = Number(req.query["limit"]) || 100;
      const offset = Number(req.query["offset"]) || 0;
      res.json(await adminFoundationService.listAuditLogs(limit, offset));
  }),

  listUploads: asyncHandler((_req, res) => {
    res.json([]);
  }),

  listUsers: asyncHandler(async (req, res) => {
      const limit = Number(req.query["limit"]) || 100;
      const offset = Number(req.query["offset"]) || 0;
      res.json(await adminFoundationService.listMitraUsers(limit, offset));
  }),

  updateUserStatus: asyncHandler(async (req, res) => {
      const { userId, status } = req.body;
      const { user: actor } = req;

      if (!userId || !status) {
        throw new ValidationError("userId and status are required");
      }

      if (!["ACTIVE", "INACTIVE", "RESIGNED"].includes(status)) {
        throw new ValidationError("Status must be one of ACTIVE, INACTIVE, or RESIGNED");
      }

      const updated = await adminFoundationService.updateUserStatus(
        userId,
        status as PartnershipStatus,
        actor.id,
      );
      res.json({ success: true, user: updated });
  }),

  processUpload: asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new ValidationError("Upload file is required");
      }

      let rows = readRows(req.file).slice(0, 200);
      const body = req.body as Record<string, unknown>;
      let division = typeof body["division"] === "string" ? body["division"] : undefined;

      // Extract headers and map using AI
      let columnMapping: Record<string, string> | undefined = undefined;
      let aiDetected = false;
      let unmappedColumns: string[] = [];

      if (rows.length > 0) {
        const firstRow = rows[0];
        if (!firstRow) return res.status(500).json({ error: "Internal error: row read failed" });
        const headers = Object.keys(firstRow);
        // Call AI mapper
        const aiResult = await aiColumnMapperService.mapColumns(headers, division);
        columnMapping = aiResult.mapping;
        unmappedColumns = aiResult.unmappedColumns;

        // Auto-detect division if missing
        if (!division && aiResult.division) {
          division = aiResult.division;
          aiDetected = true;
        }

        // Remap rows using the AI mapping result
        if (columnMapping && Object.keys(columnMapping).length > 0) {
          rows = rows.map((row) => {
            const newRow: UploadRow = {};
            for (const [key, value] of Object.entries(row)) {
              const mappedKey = columnMapping![key] || key;
              newRow[mappedKey] = value;
            }
            return newRow;
          });
        }
      }

      // 1. Initial structural validation
      const issues = validateRows(rows, division);
      
      // 2. Database existence check
      if (rows.length > 0) {
        const npks = rows.map(r => String(r["npk"] ?? "")).filter(Boolean);
        const existingUsers = await adminFoundationService.findUsersByNpk(npks);
        const existingNpks = new Set(existingUsers.map(u => u.npk));
        const userDivisions = new Map(existingUsers.map(u => [u.npk, u.division]));

        rows.forEach((row, index) => {
          const npk = String(row["npk"] ?? "");
          if (npk && !existingNpks.has(npk)) {
            issues.push({
              rowNumber: index + 1,
              column: "NPK",
              issue: `NPK '${npk}' not found in database. This row will be skipped.`,
              severity: "ERROR"
            });
          } else if (npk && division && userDivisions.get(npk) !== division) {
             issues.push({
              rowNumber: index + 1,
              column: "Division",
              issue: `User belongs to ${userDivisions.get(npk)} but upload is for ${division}. This row will be skipped.`,
              severity: "ERROR"
            });
          }
        });
      }

      const errorRows = new Set(issues.filter((issue) => issue.severity === "ERROR").map((issue) => issue.rowNumber));
      const warningRows = new Set(issues.filter((issue) => issue.severity === "WARNING").map((issue) => issue.rowNumber));
      
      res.json({
        division,
        aiDetected,
        columnMapping,
        unmappedColumns,
        rows: rows.map((row, index) => {
          // EXTREMELY IMPORTANT: Use raw values from the row to prevent AI hallucinations
          const rawName = row["nama"] || row["name"] || "";
          const fungsi = String(row["fungsi"] || "").toUpperCase();
          
          // Division logic based on Fungsi
          let derivedDivision = "-";
          const opCenterKeywords = ["AAV", "RVO", "CC SK"];
          const teleCenterKeywords = ["DELTA", "TEMA", "DESIRE", "GC", "SBPV"];

          if (opCenterKeywords.some(k => fungsi.includes(k))) {
            derivedDivision = "OPCENT";
          } else if (teleCenterKeywords.some(k => fungsi.includes(k))) {
            derivedDivision = "TELE";
          }

          return {
            rowNumber: index + 1,
            npk: String(row["npk"] ?? ""),
            name: String(rawName),
            fungsi: String(row["fungsi"] || ""),
            division: derivedDivision,
            sourceUnits: sourceUnitValue(row, division),
            sourceType: division === "TECHNO" ? "PROJECTS" : "SLOTS",
            tier: String(row["jenis_membership"] || ""),
          };
        }),
        issues,
        summary: {
          totalRows: rows.length,
          validRows: rows.length - errorRows.size,
          warningRows: warningRows.size,
          errorRows: errorRows.size,
          hasErrors: errorRows.size > 0,
          canCommit: rows.length > 0 && errorRows.size === 0,
        },
      });
  }),

  commitUpload: asyncHandler(async (req, res) => {
      const { division, rows } = req.body;
      const { user: actor } = req;

      if (!division || !rows || !Array.isArray(rows)) {
        throw new ValidationError("division and rows array are required");
      }

      if (!["OPCENT", "TELE", "TECHNO"].includes(division)) {
        throw new ValidationError("Invalid division");
      }

      const idempotencyKey = req.header("Idempotency-Key")?.trim();
      if (!idempotencyKey || idempotencyKey.length > 200) {
        throw new ValidationError("A valid Idempotency-Key header is required for upload commit.");
      }

      const result = await uploadProcessingService.processUploadBatch(
        division as DivisionType,
        rows,
        actor.id,
        idempotencyKey,
      );

      res.json({ success: true, ...result });
  }),
};
