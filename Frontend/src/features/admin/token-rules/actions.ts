"use server";

/**
 * features/admin/token-rules/actions.ts
 * Server Actions for Token Conversion Rule management (HC role only).
 */

import { auth, getServerToken } from "@/lib/auth";
import { adminApi } from "@/lib/api-client";
import type { TokenConversionRuleResponse } from "@/lib/api-client";

export async function fetchTokenRules(): Promise<
  { success: true; rules: TokenConversionRuleResponse[] } | { success: false; error: string }
> {
  const session = await auth();
  if (!session || session.user?.role !== "HC_PM") {
    return { success: false, error: "Unauthorized" };
  }

  const token = await getServerToken();
  try {
    const rules = await adminApi.getTokenRules(token);
    return { success: true, rules };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch token rules",
    };
  }
}

export async function updateTokenRuleAction(
  ruleId: string,
  tokensPerUnit: number,
): Promise<
  { success: true; rule: TokenConversionRuleResponse } | { success: false; error: string }
> {
  const session = await auth();
  if (!session || session.user?.role !== "HC_PM") {
    return { success: false, error: "Unauthorized" };
  }

  const token = await getServerToken();
  try {
    const rule = await adminApi.updateTokenRule(token, ruleId, { tokensPerUnit });
    return { success: true, rule };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update token rule",
    };
  }
}
