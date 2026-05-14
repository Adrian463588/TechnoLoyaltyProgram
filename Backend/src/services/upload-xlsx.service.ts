/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * Upload XLSX Service — Real Excel file parser for Optel and Techno templates
 *
 * Maps exact Indonesian column headers from the official template files:
 *   - "Template Loyalty optel.xlsx"
 *   - "Template Loyalty Techno.xlsx"
 *
 * SOLID principles:
 *   - Single Responsibility: Only parses & validates — does not commit to DB
 *   - Open/Closed: New divisions can be added by extending the column maps
 *   - DRY: Shared cell-reading utilities and validation helpers
 */

import ExcelJS from "exceljs";
import type {
  ParseResult,
  ParsedOptelRow,
  ParsedTechnoRow,
  ValidationIssue,
} from "./upload.service";

// ============================================================
// OPTEL COLUMN MAPPING
// Matches exact headers from "Template Loyalty optel.tsv/xlsx"
// Row 1 (index 0): Main headers
// Row 2 (index 1): Sub-headers (month names) — skip for values
// Data rows start at row 3 (index 2)
// ============================================================



// Column index map for Optel (0-based, matching the TSV column order)
// NPK(0) NAMA(1) FUNGSI(2) STATUS KEMITRAAN(3) [months P2 DES..P1 JUN = 4-10]
// TOTAL SLOT(11) SLOT REGULER sub-months(12-18) TOTAL SLOT REGULER(19)
// CEK DOWNGRADE(20) DOWNGRADE?(21) RESET?(22) TOKEN(23) GRADING(24)
// JENIS MEMBERSHIP(25) STATUS RESIGN(26) ...



// ============================================================
// TECHNO COLUMN MAPPING
// Matches exact headers from "Template Loyalty Techno.tsv/xlsx"
// ============================================================

// NPK(0) NAMA(1) FUNGSI(2) SPRINT P2 JUN 2025..P1 DES 2025(3-9)
// TOTAL SPRINT P2 2025(10) TOTAL TOKEN P2 2025(11) TOTAL PENOLAKAN PROJECT(12)
// DOWNGRADE?(13) RESET?(14) TOTAL SPRINT SALDO(15) TOTAL SALDO SAAT INI(16)
// LEVEL(17) JENIS MEMBERSHIP(18) STATUS(19) REDEEM P2 2025(20) BISA REDEEM?(21)

// ============================================================
// CELL READING UTILITIES (DRY)
// ============================================================

function getCellStr(row: ExcelJS.Row, col: number): string {
  const cell = row.getCell(col + 1); // ExcelJS is 1-indexed
  const val = cell.value;
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && "richText" in val) {
    // RichText cell
    return (val).richText.map((r) => r.text).join("").trim();
  }
  if (typeof val === "object" && "result" in val) {
    // Formula cell
    const result = (val as ExcelJS.CellFormulaValue).result;
    return result != null ? String(result).trim() : "";
  }
  return String(val).trim();
}

function getCellNum(row: ExcelJS.Row, col: number): number {
  const raw = getCellStr(row, col);
  if (!raw || raw === "-" || raw === "") return 0;
  const n = parseFloat(raw.replace(/,/g, "."));
  return isNaN(n) ? 0 : n;
}

function isRowEmpty(row: ExcelJS.Row, checkCols: number[]): boolean {
  return checkCols.every((c) => getCellStr(row, c) === "");
}

// ============================================================
// OPTEL XLSX PARSER
// ============================================================

export async function parseOptelXLSX(buffer: Uint8Array | Buffer): Promise<ParseResult<ParsedOptelRow>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as import("exceljs").Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return {
      rows: [],
      issues: [{ rowNumber: 0, column: "FILE", issue: "No worksheet found in file", severity: "ERROR" }],
      validCount: 0,
      errorCount: 0,
    };
  }

  // Detect headers by scanning row 1 for known Optel columns
  const headerRow = sheet.getRow(1);
  const colMap: Record<string, number> = {};
  headerRow.eachCell((cell, colNum) => {
    const val = String(cell.value ?? "").trim().toUpperCase();
    colMap[val] = colNum - 1; // store 0-based
  });

  // Validate required headers
  const REQUIRED = ["NPK", "NAMA", "STATUS KEMITRAAN", "TOKEN", "STATUS RESIGN"];
  const issues: ValidationIssue[] = [];

  for (const req of REQUIRED) {
    if (colMap[req] === undefined) {
      issues.push({ rowNumber: 0, column: req, issue: `Required column "${req}" not found in file header`, severity: "ERROR" });
    }
  }
  if (issues.length > 0) {
    return { rows: [], issues, validCount: 0, errorCount: 0 };
  }

  // Resolve column indices (with fallbacks for slight naming variations)
  const npkCol = colMap["NPK"] ?? 0;
  const namaCol = colMap["NAMA"] ?? 1;
  const fungsiCol = colMap["FUNGSI"] ?? 2;
  const statusKemitraanCol = colMap["STATUS KEMITRAAN"] ?? 3;
  const tokenCol = colMap["TOKEN"] ?? 23;
  const statusResignCol = colMap["STATUS RESIGN"] ?? 26;
  const totalSlotCol = colMap["TOTAL SLOT"] ?? 18;
  const totalSlotRegulerCol = colMap["TOTAL SLOT REGULER"] ?? 25;
  const gradingCol = colMap["GRADING"] ?? 24;
  const downgradeCol = colMap["DOWNGRADE?"] ?? 21;
  const resetCol = colMap["RESET?"] ?? 22;

  const parsedRows: ParsedOptelRow[] = [];

  // Data starts at row 3 (1=header, 2=sub-header months, 3+=data)
  sheet.eachRow((row, rowNum) => {
    if (rowNum <= 2) return; // skip header rows

    // Skip empty rows (check NPK + NAMA)
    if (isRowEmpty(row, [npkCol, namaCol])) return;

    const rowNumber = rowNum;
    const rowIssues: ValidationIssue[] = [];

    const npk = getCellStr(row, npkCol);
    const name = getCellStr(row, namaCol);
    const fungsi = getCellStr(row, fungsiCol);
    const statusKemitraanRaw = getCellStr(row, statusKemitraanCol).toUpperCase();
    const tokenRaw = getCellNum(row, tokenCol);
    const statusResignRaw = getCellStr(row, statusResignCol).toUpperCase();
    const totalSlots = getCellNum(row, totalSlotCol);
    const totalSlotReguler = getCellNum(row, totalSlotRegulerCol);
    const grading = getCellStr(row, gradingCol);
    const downgrade = getCellStr(row, downgradeCol).toUpperCase();
    const reset = getCellStr(row, resetCol).toUpperCase();

    if (!npk) rowIssues.push({ rowNumber, column: "NPK", issue: "NPK is required", severity: "ERROR" });
    if (!name) rowIssues.push({ rowNumber, column: "NAMA", issue: "Name is required", severity: "ERROR" });
    if (totalSlots < 0) {
      rowIssues.push({ rowNumber, column: "TOTAL SLOT", issue: "Negative slot value — flagged for review", severity: "WARNING" });
    }

    const partnershipStatus: "ACTIVE" | "INACTIVE" =
      statusKemitraanRaw.includes("AKTIF") || statusKemitraanRaw === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const isResigned = statusResignRaw.includes("RESIGN") || statusResignRaw === "YES";

    // Build raw record for full traceability
    const raw: Record<string, string> = {
      NPK: npk,
      NAMA: name,
      FUNGSI: fungsi,
      "STATUS KEMITRAAN": statusKemitraanRaw,
      TOKEN: String(tokenRaw),
      "STATUS RESIGN": statusResignRaw,
      "TOTAL SLOT": String(totalSlots),
      "TOTAL SLOT REGULER": String(totalSlotReguler),
      GRADING: grading,
      "DOWNGRADE?": downgrade,
      "RESET?": reset,
    };

    issues.push(...rowIssues);

    const hasBlockingError = rowIssues.some((i) => i.severity === "ERROR");
    if (!hasBlockingError) {
      parsedRows.push({
        rowNumber,
        npk,
        name,
        slots: totalSlots,
        regularSlots: totalSlotReguler,
        totalSlots,
        partnershipStatus,
        isResigned,
        raw,
      });
    }
  });

  const errorCount = issues.filter((i) => i.severity === "ERROR").length > 0
    ? (sheet.rowCount - 2) - parsedRows.length
    : 0;

  return {
    rows: parsedRows,
    issues,
    validCount: parsedRows.length,
    errorCount,
  };
}

// ============================================================
// TECHNO XLSX PARSER
// ============================================================

export async function parseTechnoXLSX(buffer: Uint8Array | Buffer): Promise<ParseResult<ParsedTechnoRow>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as import("exceljs").Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return {
      rows: [],
      issues: [{ rowNumber: 0, column: "FILE", issue: "No worksheet found in file", severity: "ERROR" }],
      validCount: 0,
      errorCount: 0,
    };
  }

  const headerRow = sheet.getRow(1);
  const colMap: Record<string, number> = {};
  headerRow.eachCell((cell, colNum) => {
    const val = String(cell.value ?? "").trim().toUpperCase().replace(/\n/g, " ");
    colMap[val] = colNum - 1;
  });

  const REQUIRED_TECHNO = ["NPK", "NAMA", "STATUS"];
  const issues: ValidationIssue[] = [];
  for (const req of REQUIRED_TECHNO) {
    if (colMap[req] === undefined) {
      issues.push({ rowNumber: 0, column: req, issue: `Required column "${req}" not found`, severity: "ERROR" });
    }
  }
  if (issues.length > 0) return { rows: [], issues, validCount: 0, errorCount: 0 };

  const npkCol = colMap["NPK"] ?? 0;
  const namaCol = colMap["NAMA"] ?? 1;
  const fungsiCol = colMap["FUNGSI"] ?? 2;
  const statusCol = colMap["STATUS"] ?? 19;
  const totalSprintCol = colMap["TOTAL SPRINT P2 2025"] ?? colMap["TOTAL SPRINT SALDO S.D P2 2025"] ?? 10;
  const totalTokenCol = colMap["TOTAL TOKEN P2 2025"] ?? colMap["TOTAL SALDO SAAT INI S.D P2 2025"] ?? 11;
  const rejectionCol = colMap["TOTAL PENOLAKAN PROJECT"] ?? 12;
  const downgradeCol = colMap["DOWNGRADE?"] ?? 13;
  const resetCol = colMap["RESET?"] ?? 14;
  const levelCol = colMap["LEVEL"] ?? 17;

  // Sprint month columns — detect dynamically
  const sprintColIndices: number[] = [];
  headerRow.eachCell((cell, colNum) => {
    const val = String(cell.value ?? "").trim().toUpperCase();
    if (val.startsWith("SPRINT ")) sprintColIndices.push(colNum - 1);
  });

  const parsedRows: ParsedTechnoRow[] = [];

  // Techno data starts at row 2 (only 1 header row)
  sheet.eachRow((row, rowNum) => {
    if (rowNum <= 1) return;
    if (isRowEmpty(row, [npkCol, namaCol])) return;

    const rowNumber = rowNum;
    const rowIssues: ValidationIssue[] = [];

    const npk = getCellStr(row, npkCol);
    const name = getCellStr(row, namaCol);
    const fungsi = getCellStr(row, fungsiCol);
    const statusRaw = getCellStr(row, statusCol).toUpperCase();
    const totalSprints = getCellNum(row, totalSprintCol);
    const totalToken = getCellNum(row, totalTokenCol);
    const rejections = getCellNum(row, rejectionCol);
    const downgrade = getCellStr(row, downgradeCol).toUpperCase();
    const reset = getCellStr(row, resetCol).toUpperCase();
    const level = getCellStr(row, levelCol);

    const monthlySprints = sprintColIndices.map((ci) => getCellNum(row, ci));

    if (!npk) rowIssues.push({ rowNumber, column: "NPK", issue: "NPK is required", severity: "ERROR" });
    if (!name) rowIssues.push({ rowNumber, column: "NAMA", issue: "Name is required", severity: "ERROR" });

    const partnershipStatus: "ACTIVE" | "INACTIVE" =
      statusRaw.includes("AKTIF") || statusRaw === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const isResigned = statusRaw.includes("RESIGN") || statusRaw === "YES";

    const raw: Record<string, string> = {
      NPK: npk,
      NAMA: name,
      FUNGSI: fungsi,
      STATUS: statusRaw,
      "TOTAL SPRINT": String(totalSprints),
      "TOTAL TOKEN": String(totalToken),
      "TOTAL PENOLAKAN PROJECT": String(rejections),
      "DOWNGRADE?": downgrade,
      "RESET?": reset,
      LEVEL: level,
    };

    issues.push(...rowIssues);
    const hasBlockingError = rowIssues.some((i) => i.severity === "ERROR");
    if (!hasBlockingError) {
      parsedRows.push({
        rowNumber,
        npk,
        name,
        monthlySprints,
        totalSprintPerPeriod: totalSprints,
        projectRejections: rejections,
        partnershipStatus,
        isResigned,
        raw,
      });
    }
  });

  const errorCount = issues.filter((i) => i.severity === "ERROR").length > 0
    ? (sheet.rowCount - 1) - parsedRows.length
    : 0;

  return {
    rows: parsedRows,
    issues,
    validCount: parsedRows.length,
    errorCount,
  };
}

// ============================================================
// DIVISION AUTO-DETECT
// Reads first row of headers and detects which template it is
// ============================================================

export async function detectDivisionFromXLSX(buffer: Uint8Array | Buffer): Promise<"OPTEL" | "TECHNO" | null> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as import("exceljs").Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return null;

  const headerRow = sheet.getRow(1);
  let hasSlot = false;
  let hasSprint = false;

  headerRow.eachCell((cell) => {
    const val = String(cell.value ?? "").toUpperCase();
    if (val.includes("SLOT")) hasSlot = true;
    if (val.includes("SPRINT")) hasSprint = true;
  });

  if (hasSprint) return "TECHNO";
  if (hasSlot) return "OPTEL";
  return null;
}




