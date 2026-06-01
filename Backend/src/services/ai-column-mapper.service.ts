import { GoogleGenAI, Type } from "@google/genai";

const CANONICAL_FIELDS = [
  "npk",
  "name",
  "nama",
  "fungsi",
  "token",
  "jenis_membership"
];

export interface ColumnMappingResult {
  mapping: Record<string, string>;
  unmappedColumns: string[];
  division?: "OPCENT" | "TELE" | "TECHNO";
}

export class AiColumnMapperService {
  private ai: GoogleGenAI | null = null;
  private modelName = process.env.GEMINI_MODEL || "gemini-flash-latest"; // default fallback

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "your_google_ai_api_key_here") {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  mapColumns(headers: string[], divisionHint?: string): Promise<ColumnMappingResult> {
    // We bypass AI and use strict mapping to satisfy the user's requirement
    // "pastikan kolom yang diambil kolom yang sudah saya mention sebelumnya"
    return Promise.resolve(this.fallbackMapping(headers, divisionHint));
  }

  private fallbackMapping(headers: string[], divisionHint?: string): ColumnMappingResult {
    const mapping: Record<string, string> = {};
    const unmapped: string[] = [];

    // Map of common variations to canonical fields - STRICT VERSION
    // ONLY NPK, NAMA, FUNGSI, TOKEN, JENIS MEMBERSHIP
    const fuzzyRules: Record<string, string[]> = {
      npk: ["npk", "no. induk", "no induk", "employee id", "nip", "no_induk", "no.induk", "nomor induk", "no induk pegawai"],
      nama: ["nama", "name", "full name", "nama lengkap", "employee name", "nama karyawan"],
      fungsi: ["fungsi", "function", "unit", "bidang", "departemen", "department"],
      token: ["token", "total token", "jumlah token"],
      jenis_membership: ["jenis membership", "membership", "membership tier", "tier", "membership level"],
    };

    for (const h of headers) {
      const lower = h.toLowerCase().trim();
      let matched = false;
      
      for (const [canonical, variants] of Object.entries(fuzzyRules)) {
        // Match if exact or if it's a very clear header
        if (variants.some(v => lower === v)) {
          mapping[h] = canonical;
          matched = true;
          break;
        }
      }

      if (!matched) unmapped.push(h);
    }

    return {
      mapping,
      unmappedColumns: unmapped,
      division: (divisionHint || "OPCENT") as any
    };
  }
}

export const aiColumnMapperService = new AiColumnMapperService();
