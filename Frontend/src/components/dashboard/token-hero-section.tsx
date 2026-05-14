import React from "react";
import { TierBadge, MembershipTier, EligibilityChip } from "@/components/shared/status-badge";
import { TokenCardSkeleton } from "@/components/shared/skeleton-card";
import { AnimatedTokenCount } from "./animated-token-count";
import { Coins } from "lucide-react";

interface TokenHeroSectionProps {
  tokenBalance: number;
  tier: MembershipTier;
  eligibilityStatus: { eligible: boolean; reason?: string };
  isLoading?: boolean;
}

export function TokenHeroSection({
  tokenBalance,
  tier,
  eligibilityStatus,
  isLoading,
}: TokenHeroSectionProps) {
  if (isLoading) {
    return <TokenCardSkeleton />;
  }

  return (
    <div className="bento-card flex flex-col justify-between p-6 w-full" data-interactive="true">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-label flex items-center gap-2">
          <Coins className="h-[14px] w-[14px] text-[--color-accent]" />
          Total Tokens
        </h3>
        <TierBadge tier={tier} />
      </div>

      <div className="mb-6">
        <p className="text-metric-hero">
          <AnimatedTokenCount value={tokenBalance} />
        </p>
      </div>

      <div className="border-t border-[--color-border-subtle] pt-4 mt-auto">
        <EligibilityChip 
          eligible={eligibilityStatus.eligible} 
          reason={eligibilityStatus.reason} 
        />
      </div>
    </div>
  );
}

