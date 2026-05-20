import React from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Settings, Coins } from "lucide-react";
import { TokenRulesList } from "@/features/admin/token-rules/token-rules-list";

export default function TokenRulesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bento-grid">
          {/* Page Header */}
          <div className="bento-span-12 bento-card p-6 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div>
              <h1 className="text-card-heading text-2xl mb-1 flex items-center gap-3">
                <Settings className="h-6 w-6 text-[--color-accent]" />
                Token Conversion Rules
              </h1>
              <p className="text-[--color-text-secondary]">
                Configure how many tokens are awarded per shift slot or project completion.
              </p>
            </div>
            <div className="mt-4 md:mt-0 px-4 py-2 bg-[--color-accent-muted] text-[--color-accent] rounded-full text-sm font-semibold border border-[--color-border-accent] flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Conversion Config
            </div>
          </div>

          {/* Info Banner */}
          <div className="bento-span-12 bento-card p-4 animate-fade-up-in stagger-1 border-l-4 border-[--color-info]">
            <p className="text-sm text-[--color-text-secondary]">
              <strong className="text-[--color-text-primary]">Note:</strong>{" "}
              Changes take effect immediately for all future token calculations.
              Historical ledger entries are not affected. All changes are recorded in the audit log.
            </p>
          </div>

          {/* Token Rule Cards */}
          <div className="bento-span-12">
            <TokenRulesList />
          </div>
        </div>
      </main>
    </div>
  );
}
