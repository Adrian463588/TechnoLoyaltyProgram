import { DivisionType } from "@prisma/client";
import { TokenEngine } from "./types";
import { OpcentTeleTokenEngine } from "./opcent/engine";
import { TechnoTokenEngine } from "./techno/engine";

export * from "./types";
export * from "./opcent/engine";
export * from "./techno/engine";

const opcentTeleEngine = new OpcentTeleTokenEngine();
const technoEngine = new TechnoTokenEngine();

export function getTokenEngine(division: DivisionType | string): TokenEngine {
  if (division === "TECHNO") {
    return technoEngine;
  }
  // OPCENT and TELE share the same engine
  return opcentTeleEngine;
}
