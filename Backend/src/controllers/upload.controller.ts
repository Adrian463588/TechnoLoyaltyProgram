/**
 * Backend/src/controllers/upload.controller.ts
 *
 * HTTP request handlers for file upload endpoints.
 * Delegates to UploadProcessingService — no parsing logic here.
 *
 * SOLID — SRP: only handles multipart parsing and response shaping.
 */

import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "@/types/api.types";
import { UploadProcessingService, parseOptelCSV, parseTechnoCSV, buildUploadSummary } from "@/services/upload.service";
import { parseOptelXLSX, parseTechnoXLSX, detectDivisionFromXLSX }                    from "@/services/upload-xlsx.service";
import { uploadMetaSchema } from "@/types/validations";

const XLSX_EXTENSIONS = [".xlsx", ".xls"] as const;
const CSV_EXTENSIONS  = [".csv", ".tsv"]  as const;

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
      const upload = await UploadProcessingService.getById(req.params["id"]!);
      if (!upload) {
        res.status(404).json({ error: "Upload not found" });
        return;
      }
      res.json(upload);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/uploads — stage a file
  stageFile: (async (req, res, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      // Express multer middleware would populate req.file; for now use body
      const { filename, divisionType } = req.body as { filename: string; divisionType: string };

      const metaParsed = uploadMetaSchema.safeParse({ filename, divisionType });
      if (!metaParsed.success) {
        res.status(400).json({ error: "Invalid metadata", details: metaParsed.error.flatten() });
        return;
      }

      const buffer          = req.body.fileBuffer as Buffer;
      const { upload }      = await UploadProcessingService.stageFile(filename, buffer, metaParsed.data.divisionType, user.id);
      await UploadProcessingService.validateStagedUpload(upload.id);

      res.json({ success: true, uploadId: upload.id });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/uploads/process — preview/validate file content
  processFile: (async (req, res, next) => {
    try {
      const { filename, mimeType, fileBuffer, division } = req.body as {
        filename:   string;
        mimeType:   string;
        fileBuffer: Buffer;
        division?:  string;
      };

      let resolvedDivision = division?.toUpperCase();

      if (isXLSX(filename, mimeType)) {
        if (!resolvedDivision || !["OPTEL", "TECHNO"].includes(resolvedDivision)) {
          const detected = await detectDivisionFromXLSX(fileBuffer);
          if (!detected) {
            res.status(400).json({ error: "Could not determine division from file headers." });
            return;
          }
          resolvedDivision = detected;
        }

        const divUpper = resolvedDivision as "OPTEL" | "TECHNO";
        const result   = divUpper === "OPTEL"
          ? await parseOptelXLSX(fileBuffer)
          : await parseTechnoXLSX(fileBuffer);

        const summary = buildUploadSummary(result as Parameters<typeof buildUploadSummary>[0]);
        res.json({ division: divUpper, rows: result.rows, issues: result.issues, summary });
        return;
      }

      if (isCSV(filename)) {
        if (!resolvedDivision || !["OPTEL", "TECHNO"].includes(resolvedDivision)) {
          res.status(400).json({ error: "Division must be OPTEL or TECHNO for CSV files" });
          return;
        }

        const csvText  = fileBuffer.toString("utf-8");
        const divUpper = resolvedDivision as "OPTEL" | "TECHNO";
        const result   = divUpper === "OPTEL"
          ? parseOptelCSV(csvText)
          : parseTechnoCSV(csvText);

        const summary = buildUploadSummary(result as Parameters<typeof buildUploadSummary>[0]);
        res.json({ division: divUpper, rows: result.rows, issues: result.issues, summary });
        return;
      }

      res.status(415).json({ error: `Unsupported file type: ${mimeType}` });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // POST /api/admin/uploads/:id/commit
  commitUpload: (async (req, res, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const result   = await UploadProcessingService.commitUpload(req.params["id"]!, user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
