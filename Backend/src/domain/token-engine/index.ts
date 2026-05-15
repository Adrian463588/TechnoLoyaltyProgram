/**
 * Backend/src/domain/token-engine/index.ts
 *
 * Token Engine Factory — SOLID: Factory Pattern for selecting the correct engine.
 * DRY: Single entry point for all token calculations.
 */

import { DivisionType } from "@prisma/client";
import { opcentTokenEngine, OpcentTokenEngine } from "./opcent/engine";
import { technoTokenEngine, TechnoTokenEngine } from "./techno/engine";
import { TokenEngineResult } from "./base";

export type TokenEngine = OpcentTokenEngine | TechnoTokenEngine;

/**
 * Factory function to get the appropriate token engine for a division.
 * Throws if an unsupported division is provided.
 */
export function getTokenEngine(division: DivisionType): TokenEngine {
  switch (division) {
    case DivisionType.OPCENT:
    case DivisionType.TELE:
      return opcentTokenEngine;
    case DivisionType.TECHNO:
      return technoTokenEngine;
    default:
      throw new Error(`Unsupported division: ${division}`);
  }
}

/**
 * Type guard to check if an engine is Opcent/Tele type.
 */
export function isOpcentTeleEngine(engine: TokenEngine): engine is OpcentTokenEngine {
  return engine instanceof OpcentTokenEngine;
}

/**
 * Type guard to check if an engine is Techno type.
 */
export function isTechnoEngine(engine: TokenEngine): engine is TechnoTokenEngine {
  return engine instanceof TechnoTokenEngine;
}

/**
 * Unified calculation function — use this for all token calculations.
 * Automatically selects the correct engine based on division.
 */
export function calculateTokens(
  division: DivisionType,
  cumulativeValue: number,
  referenceDate?: Date
): TokenEngineResult {
  const engine = getTokenEngine(division);
  return engine.calculate(cumulativeValue, referenceDate);
}

/**
 * Validates input for a specific division.
 */
export function validateTokenInput(
  division: DivisionType,
  value: number
): { valid: boolean; error?: string } {
  const engine = getTokenEngine(division);
  
  if (isOpcentTeleEngine(engine)) {
    return engine.validateSlotCount(value);
  }
  
  if (isTechnoEngine(engine)) {
    return engine.validateProjectCount(value);
  }
  
  return { valid: false, error: "Unknown engine type" };
}

// Export individual engines for direct access if needed
export { opcentTokenEngine, technoTokenEngine };

// Export types
export type { TokenEngineResult } from "./base";