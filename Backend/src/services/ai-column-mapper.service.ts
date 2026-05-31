import { GoogleGenAI, Type } from "@google/genai";

const CANONICAL_FIELDS = [
  "npk",
  "name",
  "total_slot",
  "total_slot_reguler",
  "total_sprint",
  "penolakan",
  "rejection_count",
  "partnership_status",
  "partner_status"
];

export interface ColumnMappingResult {
  mapping: Record<string, string>;
  unmappedColumns: string[];
  division?: "OPCENT" | "TELE" | "TECHNO";
}

export class AiColumnMapperService {
  private ai: GoogleGenAI | null = null;
  private modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash"; // default fallback

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "your_google_ai_api_key_here") {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async mapColumns(headers: string[], divisionHint?: string): Promise<ColumnMappingResult> {
    if (!this.ai) {
      console.warn("[AI_MAPPER] GEMINI_API_KEY not configured. Falling back to default identity mapping.");
      return this.fallbackMapping(headers, divisionHint);
    }

    const modelsToTry = [
      this.modelName,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash"
    ].filter(Boolean);

    const uniqueModels = Array.from(new Set(modelsToTry));
    let response = null;
    let lastError = null;

    for (const modelName of uniqueModels) {
      try {
        console.warn(`[AI_MAPPER] Attempting column mapping with model: ${modelName}`);
        response = await this.ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [{
                text: `You are an AI column mapper for an HR Loyalty Program bulk upload system.
Your task is to map the provided CSV/Excel headers to our system's canonical fields.

Canonical fields available: ${CANONICAL_FIELDS.join(", ")}
Division hint (if any): ${divisionHint || "none"}

Headers to map:
${headers.map((h, i) => `${i + 1}. "${h}"`).join("\n")}

Map each header to the best matching canonical field. If a header does not match any canonical field, do not include it in the mapping. Return unmapped columns in the unmappedColumns array. If division can be detected from the headers (e.g., 'sprint' implies TECHNO, 'slot' implies OPCENT/TELE), return it.`
              }]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mapping: {
                  type: Type.OBJECT,
                  description: "Map from original header string to canonical field string",
                  additionalProperties: { type: Type.STRING }
                },
                unmappedColumns: {
                  type: Type.ARRAY,
                  description: "List of original headers that could not be mapped to any canonical field",
                  items: { type: Type.STRING }
                },
                division: {
                  type: Type.STRING,
                  description: "Detected division based on headers (OPCENT, TELE, TECHNO)",
                  enum: ["OPCENT", "TELE", "TECHNO"]
                }
              },
              required: ["mapping", "unmappedColumns"]
            },
            temperature: 0.1, // Low temperature for deterministic output
          }
        });
        console.warn(`[AI_MAPPER] Successfully mapped columns with model: ${modelName}`);
        break;
      } catch (err: any) {
        lastError = err;
        console.error(`[AI_MAPPER] Model ${modelName} failed:`, err.message || err);
      }
    }

    try {
      if (!response || !response.text) {
        throw lastError || new Error("All Gemini models failed to map columns.");
      }
      
      const parsed = JSON.parse(response.text) as ColumnMappingResult;
      
      // Clean up mapping (ensure it only contains requested headers and canonical fields)
      const cleanMapping: Record<string, string> = {};
      for (const [key, val] of Object.entries(parsed.mapping)) {
        if (headers.includes(key)) {
          cleanMapping[key] = val;
        }
      }
      
      return {
        mapping: cleanMapping,
        unmappedColumns: parsed.unmappedColumns || [],
        ...(parsed.division !== undefined ? { division: parsed.division } : {}),
      };

    } catch (error) {
      console.error("[AI_MAPPER] Error calling Gemini API:", error);
      return this.fallbackMapping(headers, divisionHint);
    }
  }

  private fallbackMapping(headers: string[], divisionHint?: string): ColumnMappingResult {
    // Identity mapping (header maps to itself if it's already a canonical field)
    const mapping: Record<string, string> = {};
    const unmapped: string[] = [];

    for (const h of headers) {
      const lower = h.toLowerCase().trim();
      let matched = false;
      for (const c of CANONICAL_FIELDS) {
        if (lower === c || lower.includes(c)) {
          mapping[h] = c;
          matched = true;
          break;
        }
      }
      if (!matched) unmapped.push(h);
    }

    return {
      mapping,
      unmappedColumns: unmapped,
      division: divisionHint as any
    };
  }
}

export const aiColumnMapperService = new AiColumnMapperService();
