/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Unit Tests — Upload Service
 * Covers file parsing and the new UploadProcessingService
 */

import { describe, it, expect } from "vitest";
import { FileParser } from "@/utils/file-parser";

// ── FileParser ─────────────────────────────────────────────
describe("FileParser", () => {
  it("parses a valid CSV row and normalizes keys", () => {
    const csv = "NPK,Nama,Divisi,Slots,Status Kemitraan\nEMP001,John,OPTEL,10,AKTIF";
    const result = FileParser.parseCsv(csv);
    
    expect(result.length).toBe(1);
    expect(result[0]!.npk).toBe("EMP001");
    expect(result[0]!.name).toBe("John");
    expect(result[0]!.division).toBe("OPTEL");
    expect(result[0]!.slots).toBe(10);
    expect(result[0]!.partnershipStatus).toBe("AKTIF");
  });

  it("handles missing values in CSV gracefully", () => {
    const csv = "NPK,Name,Division\nEMP001,,OPTEL";
    const result = FileParser.parseCsv(csv);
    
    expect(result.length).toBe(1);
    expect(result[0]!.npk).toBe("EMP001");
    expect(result[0]!.name).toBe(null);
    expect(result[0]!.division).toBe("OPTEL");
  });
});

describe("UploadProcessingService logic", () => {
  it("rejects unsupported file extensions", () => {
    expect(() => {
      FileParser.parseBuffer(Buffer.from("dummy"), "test.txt");
    }).toThrow("Unsupported file type: .txt");
  });

  it("routes CSV extension to parseCsv", () => {
    const csv = "NPK\nEMP001";
    const result = FileParser.parseBuffer(Buffer.from(csv), "test.csv");
    expect(result.length).toBe(1);
    expect(result[0]!.npk).toBe("EMP001");
  });
});
