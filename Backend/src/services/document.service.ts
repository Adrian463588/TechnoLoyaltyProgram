/**
 * Backend/src/services/document.service.ts
 *
 * Service for handling user document uploads and retrieval.
 */

import { prisma } from "../db/prisma";
import { ValidationError } from "../errors";
import fs from "fs/promises";
import path from "path";

export const DocumentService = {
  /**
   * Save or update a user document metadata in DB.
   */
  async saveDocument(data: {
    userId: string;
    type: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) {
    const { userId, type } = data;

    // Check for existing document of this type to delete physical file if needed
    const existing = await prisma.userDocument.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (existing) {
      try {
        const fullPath = path.join(process.cwd(), existing.fileUrl);
        await fs.unlink(fullPath);
      } catch (err) {
        console.warn(`[DocumentService] Failed to delete old file: ${existing.fileUrl}`, err);
      }
    }

    return prisma.userDocument.upsert({
      where: { userId_type: { userId, type } },
      create: data,
      update: {
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      },
    });
  },

  /**
   * List all documents for a user.
   */
  async getUserDocuments(userId: string) {
    return prisma.userDocument.findMany({
      where: { userId },
      orderBy: { type: "asc" },
    });
  },

  /**
   * Delete a document.
   */
  async deleteDocument(userId: string, type: string) {
    const doc = await prisma.userDocument.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (!doc) throw new ValidationError("Document not found");

    // Delete file
    try {
      const fullPath = path.join(process.cwd(), doc.fileUrl);
      await fs.unlink(fullPath);
    } catch (err) {
      console.warn(`[DocumentService] Failed to delete file: ${doc.fileUrl}`, err);
    }

    // Delete record
    return prisma.userDocument.delete({
      where: { id: doc.id },
    });
  }
};
