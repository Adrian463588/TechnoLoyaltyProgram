import type { RequestHandler } from "express";
import multer, { type FileFilterCallback } from "multer";
import * as XLSX from "xlsx";
import { prisma } from "@/db/prisma";
import { ValidationError } from "@/errors";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
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
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<UploadRow>(sheet, { defval: null });
  }

  const text = file.buffer.toString("utf8");
  const delimiter = text.includes("\t") ? "\t" : ",";
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!headerLine) return [];
  const headers = headerLine.split(delimiter).map(normalizeHeader);
  return lines.map((line) => {
    const values = line.split(delimiter);
    return headers.reduce<UploadRow>((row, header, index) => {
      row[header] = values[index]?.trim() ?? "";
      return row;
    }, {});
  });
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
    if (!row["npk"]) {
      issues.push({ rowNumber: index + 2, column: "npk", issue: "NPK is required", severity: "ERROR" });
    }
    if (!row["name"]) {
      issues.push({ rowNumber: index + 2, column: "name", issue: "Name is required", severity: "ERROR" });
    }
    return issues;
  });
}

export const uploadProcessMiddleware = upload.single("file");

export const AdminFoundationController = {
  listAuditLogs: (async (_req, res, next) => {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      res.json(
        logs.map((log) => ({
          id: log.id,
          action: log.action,
          actorId: log.actorId,
          actorName: log.actorId === "SYSTEM" ? "System" : log.actorId,
          actorNpk: log.actorId,
          targetId: log.targetEntityId,
          targetType: log.targetEntityType,
          details: log.newValue ?? log.previousValue ?? {},
          createdAt: log.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  listUploads: ((_req, res) => {
    res.json([]);
  }) satisfies RequestHandler,

  processUpload: ((req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError("Upload file is required");
      }

      const rows = readRows(req.file).slice(0, 200);
      const issues = validateRows(rows);
      const errorRows = new Set(issues.filter((issue) => issue.severity === "ERROR").map((issue) => issue.rowNumber));
      const warningRows = new Set(issues.filter((issue) => issue.severity === "WARNING").map((issue) => issue.rowNumber));
      const body = req.body as Record<string, unknown>;
      const division = typeof body["division"] === "string" ? body["division"] : undefined;

      res.json({
        division,
        rows: rows.map((row, index) => ({
          rowNumber: index + 2,
          npk: String(row["npk"] ?? ""),
          name: String(row["name"] ?? ""),
          ...row,
        })),
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
};
