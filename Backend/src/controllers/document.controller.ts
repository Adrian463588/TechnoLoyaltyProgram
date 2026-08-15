import { asyncHandler } from "@/middleware/asyncHandler";
/**
 * Backend/src/controllers/document.controller.ts
 *
 * Controller for handling user document uploads.
 */

import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { ValidationError } from "../errors";
import { DocumentService } from "../services/document.service";

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = "uploads/documents";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user.id;
    const type = req.body.type || "unknown";
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${type}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const allowed = new Set([
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/heic",
      "image/heif"
    ]);
    if (!allowed.has(file.mimetype)) {
      cb(new ValidationError("Unsupported file format. Please upload PNG, JPG, or HEIC."));
      return;
    }
    cb(null, true);
  },
});

export const DocumentController = {
  /**
   * Middleware for handling the file upload.
   */
  uploadMiddleware: upload.single("file"),

  /**
   * Handler for processing the uploaded document.
   */
  uploadDocument: asyncHandler(async (req, res) => {
      const { user } = req as any;
      const { type } = req.body;

      if (!req.file) {
        throw new ValidationError("No file uploaded");
      }

      if (!type || !["ID_CARD_MITRA", "KTP", "NPWP"].includes(type)) {
        throw new ValidationError("Invalid document type");
      }

      const doc = await DocumentService.saveDocument({
        userId: user.id,
        type,
        fileUrl: req.file.path.replace(/\\/g, "/"),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.status(201).json(doc);
  }),

  /**
   * Handler for listing user documents.
   */
  listDocuments: asyncHandler(async (req, res) => {
      const { user } = req as any;
      const docs = await DocumentService.getUserDocuments(user.id);
      res.json(docs);
  }),

  /**
   * Handler for deleting a document.
   */
  deleteDocument: asyncHandler(async (req, res) => {
      const { user } = req as any;
      const { type } = req.params;
      if (!type) throw new ValidationError("Document type is required");
      await DocumentService.deleteDocument(user.id, type);
      res.status(204).send();
  }),
};
