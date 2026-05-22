import type { RequestHandler } from "express";
import multer, { type FileFilterCallback } from "multer";
import * as XLSX from "xlsx";
import { prisma } from "@/db/prisma";
import { ValidationError } from "@/errors";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { logAudit } from "@/services/audit.service";

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
