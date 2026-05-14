/**
 * Backend/src/controllers/upload.controller.ts
 *
 * HTTP request handlers for file upload endpoints.
 * Delegates to UploadProcessingService — no parsing logic here.
 *
 * SOLID — SRP: only handles multipart parsing and response shaping.
 */

import type { RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import {
  UploadProcessingService,
  parseOptelCSV,
  parseTechnoCSV,
  buildUploadSummary,
} from "@/services/upload.service";
import {
  parseOptelXLSX,
  parseTechnoXLSX,
  detectDivisionFromXLSX,
} from "@/services/upload-xlsx.service";
import { uploadMetaSchema, uuidSchema } from "@/types/validations";
import { ValidationError } from "@/errors/validation-error";
import { NotFoundError } from "@/errors/not-found-error";

// ── Multer Configuration ──────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadMiddleware = upload.single("file");

const XLSX_EXTENSIONS = [".xlsx", ".xls"] as const;
const CSV_EXTENSIONS = [".csv", ".tsv"] as const;

function getExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf(".")).toLowerCase();
}

function isXLSX(filename: string, mimeType: string): boolean {
  const ext = getExtension(filename);
  return (
    (XLSX_EXTENSIONS as readonly string[]).includes(ext) ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  );
}

function isCSV(filename: string): boolean {
  return (CSV_EXTENSIONS as readonly string[]).includes(getExtension(filename));
}

export const UploadController = {

  // GET /api/admin/uploads
  listAll: (async (_req, res, next) => {
    try {
      const uploads = await UploadProcessingService.listAll();
      res.json(uploads);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // GET /api/admin/uploads/:id
  getById: (async (req, res, next) => {
    try {
      const idParam = req.params["id"];
      const idResult = uuidSchema.safeParse(idParam);
      if (!idResult.success) {
        throw new ValidationError("Invalid upload ID format", { id: idParam });
      }

      const uploadRecord = await UploadProcessingService.getById(idResult.data);
      if (!uploadRecord) {
        throw new NotFoundError("Upload", idResult.data);
      }
      res.json(uploadRecord);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/uploads — stage a file
  stageFile: (async (req, res, next) => {
    try {
      const { user } = req;

      if (!req.file) {
        throw new ValidationError("No file uploaded");
      }

      const { filename, divisionType } = req.body as {
        filename?: string;
        divisionType?: string;
      };
      const actualFilename = filename ?? req.file.originalname;

      const metaParsed = uploadMetaSchema.safeParse({ filename: actualFilename, divisionType });
      if (!metaParsed.success) {
        throw new ValidationError(
          "Invalid file metadata",
          z.treeifyError(metaParsed.error),
        );
      }

      const { upload: stagedUpload } = await UploadProcessingService.stageFile(
        actualFilename,
        req.file.buffer,
        metaParsed.data.divisionType,
        user.id,
      );
      await UploadProcessingService.validateStagedUpload(stagedUpload.id);

      res.json({ success: true, uploadId: stagedUpload.id });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/uploads/process — preview/validate file content
  processFile: (async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError("No file uploaded");
      }

      const { division } = req.body as { division?: string };
      const filename = req.file.originalname;
      const mimeType = req.file.mimetype;
      const fileBuffer = req.file.buffer;

      let resolvedDivision = division?.toUpperCase();

      if (isXLSX(filename, mimeType)) {
        if (!resolvedDivision || !["OPTEL", "TECHNO"].includes(resolvedDivision)) {
          const detected = await detectDivisionFromXLSX(fileBuffer);
          if (!detected) {
            throw new ValidationError("Could not determine division from file headers");
          }
          resolvedDivision = detected;
        }

        const divUpper = resolvedDivision as "OPTEL" | "TECHNO";
        const result =
          divUpper === "OPTEL"
            ? await parseOptelXLSX(fileBuffer)
            : await parseTechnoXLSX(fileBuffer);

        const summary = buildUploadSummary(result);
        res.json({ division: divUpper, rows: result.rows, issues: result.issues, summary });
        return;
      }

      if (isCSV(filename)) {
        if (!resolvedDivision || !["OPTEL", "TECHNO"].includes(resolvedDivision)) {
          throw new ValidationError("Division must be OPTEL or TECHNO for CSV files");
        }

        const csvText = fileBuffer.toString("utf-8");
        const divUpper = resolvedDivision as "OPTEL" | "TECHNO";
        const result =
          divUpper === "OPTEL" ? parseOptelCSV(csvText) : parseTechnoCSV(csvText);

        const summary = buildUploadSummary(result);
        res.json({ division: divUpper, rows: result.rows, issues: result.issues, summary });
        return;
      }

      throw new ValidationError(`Unsupported file type: ${mimeType}`);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/uploads/:id/commit
  commitUpload: (async (req, res, next) => {
    try {
      const { user } = req;

      const idParam = req.params["id"];
      const idResult = uuidSchema.safeParse(idParam);
      if (!idResult.success) {
        throw new ValidationError("Invalid upload ID format", { id: idParam });
      }

      const result = await UploadProcessingService.commitUpload(idResult.data, user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
