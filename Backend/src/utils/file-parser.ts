/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Papa from "papaparse";
import * as xlsx from "xlsx";

/**
 * Standardizes the keys from Excel/CSV to map to our internal schemas.
 * Example: "Nama" -> "name", "NPK" -> "npk"
 */
function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.trim().toLowerCase();
    
    if (cleanKey === "npk") normalized.npk = value;
    else if (cleanKey === "nama" || cleanKey === "name") normalized.name = value;
    else if (cleanKey === "division" || cleanKey === "divisi") normalized.division = value;
    else if (cleanKey === "status" || cleanKey === "employment status") normalized.employmentStatus = value;
    // Optel specific
    else if (cleanKey === "slots" || cleanKey === "slot accumulation") normalized.slots = value;
    else if (cleanKey === "regular slots") normalized.regularSlots = value;
    else if (cleanKey === "partnership status" || cleanKey === "status kemitraan") normalized.partnershipStatus = value;
    // Techno specific
    else if (cleanKey === "sprint balance" || cleanKey === "total sprint") normalized.sprintBalance = value;
    else if (cleanKey === "project rejections") normalized.projectRejections = value;
    // Keep raw for everything else
    else normalized[cleanKey] = value;
  }
  return normalized;
}

export class FileParser {
  /**
   * Parses a CSV Buffer or string into an array of normalized objects.
   */
  static parseCsv(csvBuffer: Buffer | string): Record<string, unknown>[] {
    const csvString = Buffer.isBuffer(csvBuffer) ? csvBuffer.toString("utf-8") : csvBuffer;
    
    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      // Treat tab as separator if we detect it's a tab-separated file 
      // (sometimes users save as TSV but use .csv extension)
      dynamicTyping: true, 
    });

    if (parsed.errors.length > 0 && parsed.errors[0]?.code !== "UndetectableDelimiter") {
      throw new Error(`CSV Parsing Error: ${parsed.errors[0]?.message}`);
    }

    return parsed.data.map((row) => normalizeRowKeys(row as Record<string, unknown>));
  }

  /**
   * Parses an XLSX Buffer into an array of normalized objects.
   */
  static parseXlsx(xlsxBuffer: Buffer): Record<string, unknown>[] {
    const workbook = xlsx.read(xlsxBuffer, { type: "buffer" });
    if (workbook.SheetNames.length === 0) {
      throw new Error("Excel file is empty");
    }
    
    const firstSheetName = workbook.SheetNames[0]!;
    const worksheet = workbook.Sheets[firstSheetName];
    
    if (!worksheet) {
      throw new Error(`Sheet "${firstSheetName}" not found in Excel file`);
    }
    
    // Convert to JSON with headers
    const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
    
    return rawData.map((row) => normalizeRowKeys(row as Record<string, unknown>));
  }
  
  /**
   * Universal parse method that handles routing to the correct parser based on filename.
   */
  static parseBuffer(buffer: Buffer, filename: string): Record<string, unknown>[] {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
      return this.parseCsv(buffer);
    } else if (ext === 'xlsx' || ext === 'xls') {
      return this.parseXlsx(buffer);
    }
    
    throw new Error(`Unsupported file type: .${ext}`);
  }
}
