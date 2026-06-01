import type { RequestHandler } from "express";
import multer, { type FileFilterCallback } from "multer";
import * as XLSX from "xlsx";
import { prisma } from "@/db/prisma";
import { ValidationError } from "@/errors";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { logAudit } from "@/services/audit.service";
import { uploadProcessingService } from "@/services/upload-processing.service";
import { aiColumnMapperService } from "@/services/ai-column-mapper.service";
import { DivisionType } from "@prisma/client";

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

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

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
    
    console.log(`[DEBUG_UPLOAD] Total rows in sheet AoA: ${data.length}`);

    // Find the row index that contains "NPK" or common variants
    const npkKeywords = ["npk", "no. induk", "no induk", "employee id", "nip", "no_induk", "nomor induk", "no.induk"];
    let headerRowIndex = data.findIndex((row, idx) => {
      const hasNpk = row.some((cell: any) => {
        const val = String(cell).toLowerCase().trim();
        return npkKeywords.some(k => val === k || val.includes(k));
      });
      if (hasNpk) console.log(`[DEBUG_UPLOAD] Found potential primary header at row index: ${idx}`);
      return hasNpk;
    });
    
    // Fallback to row 0 if NPK not found
    if (headerRowIndex === -1) {
      console.warn("[DEBUG_UPLOAD] NPK-like header NOT found, falling back to index 0");
      headerRowIndex = 0;
    }

    // Merge multi-line headers if the next row also looks like a header (e.g. contains months)
    let headers = data[headerRowIndex].map(h => String(h).trim());
    const nextRow = data[headerRowIndex + 1];
    const monthKeywords = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "ags", "sep", "okt", "nov", "des"];
    if (nextRow && nextRow.some(cell => monthKeywords.some(m => String(cell).toLowerCase().includes(m)))) {
      console.log(`[DEBUG_UPLOAD] Found secondary header (months) at row index: ${headerRowIndex + 1}`);
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

    console.log(`[DEBUG_UPLOAD] Raw rows extracted after header: ${rows.length}`);
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

  const headers = lines[headerLineIndex].split(delimiter).map(h => h.trim());
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

function validateRows(rows: UploadRow[]): Array<{
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

    // Required fields: NPK, Nama, Fungsi, Token, Jenis Membership
    const npk = row["npk"];
    const name = row["name"] || row["nama"];
    const fungsi = row["fungsi"];
    const token = row["token"];
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
    if (token === null || token === undefined || token === "") {
      issues.push({ rowNumber: index + 1, column: "Token", issue: "Token is required", severity: "ERROR" });
    }
    if (!tier) {
      issues.push({ rowNumber: index + 1, column: "Jenis Membership", issue: "Jenis Membership is required", severity: "ERROR" });
    }

    return issues;
  });
}

function getCurrentPeriod(): "P1" | "P2" {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();

  // Period 1 (P1): Dec 16 - Jun 15
  // Period 2 (P2): Jun 16 - Dec 15
  
  const isP2 = (month === 6 && date >= 16) || (month > 6 && month < 12) || (month === 12 && date <= 15);
  return isP2 ? "P2" : "P1";
}

export const uploadProcessMiddleware = upload.single("file");

export const AdminFoundationController = {
  // ... (listAuditLogs, listUploads, listUsers, updateUserStatus remains same)
  listAuditLogs: (async (req, res, next) => {
    try {
      const limit = Number(req.query["limit"]) || 100;
      const offset = Number(req.query["offset"]) || 0;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.auditLog.count()
      ]);

      res.json({
        total,
        limit,
        offset,
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          actorId: log.actorId,
          actorName: log.actorId === "SYSTEM" ? "System" : log.actorId,
          actorNpk: log.actorId,
          targetId: log.targetEntityId,
          targetType: log.targetEntityType,
          details: log.newValue ?? log.previousValue ?? {},
          createdAt: log.createdAt.toISOString(),
        }))
      });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  listUploads: ((_req, res) => {
    res.json([]);
  }) satisfies RequestHandler,

  listUsers: (async (req, res, next) => {
    try {
      const limit = Number(req.query["limit"]) || 100;
      const offset = Number(req.query["offset"]) || 0;

      const where: import("@prisma/client").Prisma.UserWhereInput = { role: "MITRA" };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            npk: true,
            email: true,
            division: true,
            role: true,
            membershipTier: true,
            partnerStatus: true
          },
          orderBy: { name: "asc" },
          take: limit,
          skip: offset,
        }),
        prisma.user.count({ where })
      ]);

      const usersWithTokens = await Promise.all(
        users.map(async (user) => ({
          ...user,
          tokens: await tokenLedgerRepository.getBalance(user.id)
        }))
      );

      res.json({
        total,
        limit,
        offset,
        users: usersWithTokens
      });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  updateUserStatus: (async (req, res, next) => {
    try {
      const { userId, status } = req.body;
      const { user: actor } = req;

      if (!userId || !status) {
        throw new ValidationError("userId and status are required");
      }

      if (!["ACTIVE", "INACTIVE", "RESIGNED"].includes(status)) {
        throw new ValidationError("Status must be one of ACTIVE, INACTIVE, or RESIGNED");
      }

      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) throw new Error("User not found");

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { partnerStatus: status },
      });

      await logAudit({
        action: "PARTNER_STATUS_UPDATED",
        actorId: actor.id,
        targetType: "User",
        targetId: userId,
        previousValue: { name: existing.name, status: existing.partnerStatus },
        newValue: { status: updated.partnerStatus },
      });

      res.json({ success: true, user: updated });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  processUpload: (async (req, res, next) => {
    try {
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
        const headers = Object.keys(rows[0]);
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
      const issues = validateRows(rows);
      
      // 2. Database existence check
      if (rows.length > 0) {
        const npks = rows.map(r => String(r["npk"] ?? "")).filter(Boolean);
        const existingUsers = await prisma.user.findMany({
          where: { npk: { in: npks } },
          select: { npk: true, division: true }
        });
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
      
      const currentPeriod = getCurrentPeriod();

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
            token: Number(row["token"] || 0),
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
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  commitUpload: (async (req, res, next) => {
    try {
      const { division, rows } = req.body;
      const { user: actor } = req;

      if (!division || !rows || !Array.isArray(rows)) {
        throw new ValidationError("division and rows array are required");
      }

      if (!["OPCENT", "TELE", "TECHNO"].includes(division)) {
        throw new ValidationError("Invalid division");
      }

      const result = await uploadProcessingService.processUploadBatch(division as DivisionType, rows, actor.id);

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
