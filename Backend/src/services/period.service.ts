/**
 * Period Service — Earning period and cut-off logic
 *
 * Handles the two fixed earning windows (P1 and P2) and
 * provides deterministic period assignment for any given date.
 */

export type PeriodId = "P1" | "P2";

export interface PeriodInfo {
  id: PeriodId;
  name: string;
  startDate: Date;
  endDate: Date; // cut-off date (inclusive)
  year: number;
  label: string; // e.g. "P1 2026"
}

/**
 * Returns the two fixed earning periods for a given calendar year.
 * - P1: December 16 (prev year) to June 15 (current year)
 * - P2: June 16 to December 15 (same year)
 */
export function getPeriodsForYear(year: number): [PeriodInfo, PeriodInfo] {
  const p1: PeriodInfo = {
    id: "P1",
    name: `P1 ${year}`,
    label: `P1 ${year} (Dec 16, ${year - 1} – Jun 15, ${year})`,
    startDate: new Date(`${year - 1}-12-16T00:00:00Z`),
    endDate: new Date(`${year}-06-15T23:59:59Z`),
    year,
  };

  const p2: PeriodInfo = {
    id: "P2",
    name: `P2 ${year}`,
    label: `P2 ${year} (Jun 16 – Dec 15, ${year})`,
    startDate: new Date(`${year}-06-16T00:00:00Z`),
    endDate: new Date(`${year}-12-15T23:59:59Z`),
    year,
  };

  return [p1, p2];
}

/**
 * Determines which earning period a given date falls into.
 * Returns null if the date doesn't fall within any known period
 * (e.g. exactly Dec 16 boundary edge — handled with inclusive check).
 */
export function getActivePeriod(date: Date = new Date()): PeriodInfo {
  const year = date.getFullYear();

  // Check current year's P2: Jun 16 – Dec 15
  const [, p2] = getPeriodsForYear(year);
  if (date >= p2.startDate && date <= p2.endDate) {
    return p2;
  }

  // Otherwise we're in P1, which spans from Dec 16 of the previous year
  const [p1] = getPeriodsForYear(year);
  if (date >= p1.startDate && date <= p1.endDate) {
    return p1;
  }

  // Dec 16 – Dec 31: P1 of next year has started
  const [p1Next] = getPeriodsForYear(year + 1);
  return p1Next;
}

/**
 * Returns true if the given date is a cut-off date (Jun 15 or Dec 15).
 */
export function isCutOffDate(date: Date): boolean {
  const month = date.getUTCMonth() + 1; // 1-indexed
  const day = date.getUTCDate();
  return (month === 6 && day === 15) || (month === 12 && day === 15);
}

/**
 * Returns the number of days remaining until the next cut-off date from a given date.
 */
export function getDaysUntilCutOff(from: Date = new Date()): number {
  const period = getActivePeriod(from);
  const diffMs = period.endDate.getTime() - from.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Calculates the progress percentage through the current earning period.
 * 0% = just started, 100% = at cut-off.
 */
export function getPeriodProgressPercent(from: Date = new Date()): number {
  const period = getActivePeriod(from);
  const totalMs = period.endDate.getTime() - period.startDate.getTime();
  const elapsedMs = from.getTime() - period.startDate.getTime();
  return Math.round(Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)));
}
