"use client";

/**
 * features/admin/token-rules/token-rules-list.tsx
 *
 * Client component that fetches and displays all token conversion rules.
 * Handles loading, error, and empty states.
 */

import React, { useEffect, useState } from "react";
import { fetchTokenRules } from "./actions";
import { TokenRuleCard } from "./token-rule-card";
import type { TokenConversionRuleResponse } from "@/lib/api-client";
import { AlertCircle, Inbox } from "lucide-react";

export function TokenRulesList() {
  const [rules, setRules] = useState<TokenConversionRuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchTokenRules();
      if (cancelled) return;

      if (result.success) {
        setRules(result.rules);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bento-card p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div>
                <div className="skeleton h-5 w-40 rounded mb-1" />
                <div className="skeleton h-3 w-28 rounded" />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[--color-surface-elevated] border border-[--color-border-subtle] mb-4">
              <div className="skeleton h-3 w-24 rounded mb-3" />
              <div className="skeleton h-10 w-24 rounded" />
            </div>
            <div className="skeleton h-3 w-48 rounded mb-4" />
            <div className="skeleton h-10 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bento-card p-8 text-center">
        <AlertCircle className="h-10 w-10 text-[--color-error] mx-auto mb-3" />
        <p className="text-[--color-error] font-medium mb-1">Failed to load token rules</p>
        <p className="text-sm text-[--color-text-secondary]">{error}</p>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="bento-card p-8 text-center">
        <Inbox className="h-10 w-10 text-[--color-text-tertiary] mx-auto mb-3" />
        <p className="text-[--color-text-secondary]">
          No token conversion rules configured yet.
        </p>
        <p className="text-xs text-[--color-text-tertiary] mt-1">
          Run the database seed to create default rules.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {rules.map((rule, index) => (
        <TokenRuleCard key={rule.id} rule={rule} index={index} />
      ))}
    </div>
  );
}
