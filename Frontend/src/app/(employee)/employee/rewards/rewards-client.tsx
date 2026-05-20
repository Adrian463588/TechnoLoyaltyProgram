"use client";

import { useState } from "react";
import { RewardItem } from "@/types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuccessAnimation } from "@/components/shared/success-animation";
import { RedemptionPipeline } from "@/components/shared/redemption-pipeline";
import { TooltipWrapper } from "@/components/shared/tooltip-wrapper";
import { Coins, Lock, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RewardsClientProps {
  rewards: RewardItem[];
  userTokens: number;
  isEligible: boolean;
}

export default function RewardsClient({ rewards, userTokens, isEligible }: RewardsClientProps) {
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRedeem = async () => {
    if (!selectedReward) return;
    setIsRedeeming(true);
    setTimeout(() => {
      setIsRedeeming(false);
      setSuccess(true);
      toast.success("Reward request submitted successfully!");
    }, 1000);
  };

  const closeDialog = () => {
    if (!isRedeeming) {
      setSelectedReward(null);
      setTimeout(() => setSuccess(false), 300);
    }
  };

  if (!isEligible) {
    return (
      <div className="space-y-4 animate-fade-up-in">
        <BentoCard className="p-12 flex flex-col items-center justify-center text-center space-y-5 border-dashed" glow={false}>
          <div className="p-5 bg-secondary/10 rounded-full text-secondary ring-2 ring-secondary/20 ring-offset-2 ring-offset-card">
            <Lock className="w-10 h-10" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-xl font-bold text-foreground">Redemption Locked</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must have at least{" "}
              <span className="font-semibold text-foreground">2,000 tokens</span> and an active
              tier status to redeem rewards. Keep completing slots and sprints to unlock the
              catalog!
            </p>
          </div>
        </BentoCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up-in">
      
      {/* Header & Token Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <BentoCard className="md:col-span-8 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag className="h-6 w-6 text-[--color-accent]" />
            <h1 className="text-card-heading text-2xl">Rewards Catalog</h1>
          </div>
          <p className="text-[--color-text-secondary]">
            Browse and redeem from the exclusive employee rewards collection.
          </p>
        </BentoCard>

        <BentoCard className="md:col-span-4 p-6 flex flex-col justify-center bg-gradient-to-br from-[--color-surface-elevated] to-[--color-surface-base] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Coins size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-[--color-text-tertiary)] uppercase tracking-widest mb-1">Your Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[--color-accent] font-display tracking-tight">
                {userTokens.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-[--color-text-secondary)]">tokens available</span>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rewards.map((reward, i) => {
          const canAfford = userTokens >= reward.tokenCost;
          const isAvailable = reward.isAvailable;
          const canRedeem = canAfford && isAvailable;

          return (
            <BentoCard
              key={reward.id}
              className={cn(
                "flex flex-col h-full animate-fade-up-in",
                !canRedeem && "opacity-80"
              )}
              style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
            >
              {/* Thumbnail area */}
              <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="w-14 h-14 text-muted-foreground/20" />
                </div>
                {/* Category chip */}
                <div className="absolute bottom-2 left-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-background/80 text-primary border border-primary/20">
                    {reward.category}
                  </span>
                </div>
                {!isAvailable && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1 space-y-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground leading-tight mb-1">
                    {reward.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {reward.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
                  <div
                    className={cn(
                      "flex items-center font-bold text-sm",
                      canAfford ? "text-primary" : "text-destructive"
                    )}
                  >
                    {reward.tokenCost.toLocaleString()}
                    <Coins className="w-3.5 h-3.5 ml-1" />
                  </div>

                  {canRedeem ? (
                    <Button
                      size="sm"
                      onClick={() => setSelectedReward(reward)}
                      data-testid={`redeem-btn-${reward.id}`}
                      className="transition-all hover:scale-105 active:scale-95"
                    >
                      Redeem
                    </Button>
                  ) : (
                    <TooltipWrapper
                      label={
                        !isAvailable
                          ? "This reward is currently out of stock"
                          : `Need ${(reward.tokenCost - userTokens).toLocaleString()} more tokens`
                      }
                    >
                      <Button
                        size="sm"
                        disabled
                        data-testid={`redeem-btn-${reward.id}`}
                        className="cursor-not-allowed"
                      >
                        Redeem
                      </Button>
                    </TooltipWrapper>
                  )}
                </div>
              </div>
            </BentoCard>
          );
        })}
      </div>

      {/* Redemption Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={closeDialog}>
        <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl p-0 overflow-hidden max-w-lg">
          {!success ? (
            <>
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-[var(--color-accent)]/10 rounded-xl text-[var(--color-accent)]">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-neutral-900 text-left">Confirm Redemption</DialogTitle>
                  </div>
                  <DialogDescription className="text-neutral-600 text-sm leading-relaxed text-left">
                    You are about to redeem your tokens for this reward. This request will be sent to the HC team for verification.
                  </DialogDescription>
                </DialogHeader>

                <div className="p-5 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Item Selected</p>
                    <h4 className="font-bold text-neutral-900 text-base">{selectedReward?.name}</h4>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-neutral-200/60">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500">Your Current Balance</span>
                      <span className="font-mono font-medium text-neutral-900">
                        {userTokens.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500">Redemption Cost</span>
                      <span className="font-mono font-bold flex items-center text-red-600">
                        −{selectedReward?.tokenCost.toLocaleString()}
                        <Coins className="w-3.5 h-3.5 ml-1.5" />
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-neutral-300 mt-2">
                      <span className="font-semibold text-neutral-700">Balance After</span>
                      <span className="font-mono font-bold flex items-center text-[var(--color-accent)] text-base">
                        {(userTokens - (selectedReward?.tokenCost ?? 0)).toLocaleString()}
                        <Coins className="w-3.5 h-3.5 ml-1.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 flex gap-3 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={closeDialog} 
                  disabled={isRedeeming}
                  className="flex-1 rounded-xl border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  data-testid="confirm-redeem-btn"
                  className="flex-1 btn-primary rounded-xl font-semibold shadow-md active:scale-95 ml-3"
                >
                  {isRedeeming ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    "Confirm Request"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <div className="mb-6">
                <SuccessAnimation size={64} />
              </div>
              <div className="space-y-2 mb-8">
                <h3 className="text-2xl font-bold text-neutral-900">Request Submitted!</h3>
                <p className="text-neutral-500 text-sm max-w-[300px] leading-relaxed mx-auto">
                  Your redemption request has been sent to HC team for verification. You can track its status in your history.
                </p>
              </div>

              {/* Pipeline */}
              <div className="w-full max-w-xs p-6 bg-neutral-50 rounded-2xl border border-neutral-100 mb-8">
                <RedemptionPipeline currentStep="submitted" />
              </div>

              <Button 
                onClick={closeDialog} 
                className="w-full btn-primary rounded-xl font-semibold py-6 text-base" 
                data-testid="done-btn"
              >
                Great, thanks!
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
