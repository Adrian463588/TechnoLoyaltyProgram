/**
 * Backend/src/services/token-rule.service.ts
 *
 * Service for managing token conversion rules.
 * Orchestrates DB update + audit logging in a single transaction.
 *
 * SOLID — SRP: conversion rule management only.
 */

import type { TokenConversionRule } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { tokenRuleRepository } from "@/repositories/token-rule.repository";
import { logAudit } from "@/services/audit.service";
import { NotFoundError, ValidationError } from "@/errors";

// ── In-memory cache for conversion rates ──────────────────────────────────
interface CachedRate {
  tokensPerUnit: number;
  fetchedAt: number;
}

const rateCache = new Map<string, CachedRate>();
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Returns all conversion rules.
 */
async function getAllRules(): Promise<TokenConversionRule[]> {
  return tokenRuleRepository.findAll();
}

/**
 * Updates a conversion rule by ID.
 * Validates input, runs in a transaction with audit log.
 */
async function updateRule(
  ruleId: string,
  tokensPerUnit: number,
  actorId: string,
): Promise<TokenConversionRule> {
  if (!Number.isInteger(tokensPerUnit) || tokensPerUnit < 1) {
    throw new ValidationError("Tokens per unit must be an integer >= 1");
  }

  const existing = await tokenRuleRepository.findById(ruleId);
  if (!existing) {
    throw new NotFoundError("Token conversion rule not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tokenRuleRepository.update(
      ruleId,
      { tokensPerUnit, updatedBy: actorId },
      tx,
    );

    await logAudit({
      action: "TOKEN_RULE_UPDATED",
      actorId,
      targetType: "TokenConversionRule",
      targetId: ruleId,
      previousValue: {
        divisionGroup: existing.divisionGroup,
        tokensPerUnit: existing.tokensPerUnit,
      },
      newValue: {
        divisionGroup: existing.divisionGroup,
        tokensPerUnit,
      },
      tx,
    });

    return result;
  });

  // Invalidate cache for this division group
  rateCache.delete(updated.divisionGroup);

  return updated;
}

/**
 * Returns the current conversion rate for a division group.
 * Uses in-memory cache with 60s TTL, falls back to hardcoded defaults.
 */
async function getConversionRate(divisionGroup: string): Promise<number> {
  const cached = rateCache.get(divisionGroup);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.tokensPerUnit;
  }

  const rule = await tokenRuleRepository.findByDivisionGroup(divisionGroup);
  if (rule) {
    rateCache.set(divisionGroup, {
      tokensPerUnit: rule.tokensPerUnit,
      fetchedAt: Date.now(),
    });
    return rule.tokensPerUnit;
  }

  // Fallback defaults (same as original hardcoded values)
  const defaults: Record<string, number> = {
    OPCENT_TELE: 1,
    TECHNO: 1,
  };
  return defaults[divisionGroup] ?? 1;
}

export const TokenRuleService = {
  getAllRules,
  updateRule,
  getConversionRate,
};
