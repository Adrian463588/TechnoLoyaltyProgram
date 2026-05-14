/**
 * Backend/src/repositories/upload.repository.ts
 *
 * Data access layer for MonthlyUpload, UploadBatch, and UploadRowStaging.
 */

import type {
  PrismaClient,
  MonthlyUpload,
  DivisionType,
  UploadStatus,
} from "@prisma/client";

export type UploadWithBatches = MonthlyUpload & {
  batches: Array<{ totalRows: number; errorRows: number }>;
};

export class UploadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<UploadWithBatches[]> {
    return this.prisma.monthlyUpload.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        batches: { select: { totalRows: true, errorRows: true } },
      },
    });
  }

  async findById(uploadId: string): Promise<MonthlyUpload | null> {
    return this.prisma.monthlyUpload.findUnique({
      where: { id: uploadId },
      include: {
        batches: {
          include: {
            stagingRows: { include: { issues: true } },
          },
        },
      },
    });
  }

  async create(data: {
    filename: string;
    divisionType: DivisionType;
    uploadedById: string;
  }): Promise<MonthlyUpload> {
    return this.prisma.monthlyUpload.create({ data });
  }

  async updateStatus(uploadId: string, status: UploadStatus): Promise<MonthlyUpload> {
    return this.prisma.monthlyUpload.update({
      where: { id: uploadId },
      data: { status },
    });
  }
}
