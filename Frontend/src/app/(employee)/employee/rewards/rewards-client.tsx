"use client";

import { useState } from "react";
import { RewardItem } from "@/types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuccessAnimation } from "@/components/shared/success-animation";
import { RedemptionPipeline } from "@/components/shared/redemption-pipeline";
import { TooltipWrapper } from "@/components/shared/tooltip-wrapper";
import { Coins, Lock, ShoppingBag } from "lucide-react";
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

const CATEGORIES = ["All", "Voucher", "Merchandise", "TimeOff", "Experience"];

export default function RewardsClient({ rewards, userTokens, isEligible }: RewardsClientProps) {
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredRewards = rewards.filter((r) =>
    activeCategory === "All" ? true : r.category === activeCategory
  );

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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Rewards Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Browse and redeem from the exclusive employee rewards collection.
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/30 text-sm px-3 py-1.5 self-start md:self-auto"
        >
          <Coins className="w-3.5 h-3.5 mr-1.5" />
          {userTokens.toLocaleString()} tokens available
        </Badge>
      </div>

      {/* Category Filter — pill with active indicator */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_4px_16px_var(--color-green-glow)]"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              )}
            >
              {cat}
              {/* Active underline dot */}
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-foreground/60" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRewards.map((reward, i) => {
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
        <DialogContent className="sm:max-w-md">
          {!success ? (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Redemption</DialogTitle>
                <DialogDescription>
                  You are about to redeem tokens for this reward. This action requires HC PM
                  verification.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 bg-muted rounded-xl space-y-3 my-2 border border-border">
                <h4 className="font-semibold">{selectedReward?.name}</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Token Cost</span>
                  <span className="font-bold flex items-center text-destructive">
                    −{selectedReward?.tokenCost.toLocaleString()}
                    <Coins className="w-3 h-3 ml-1" />
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Remaining Balance</span>
                  <span className="font-bold flex items-center text-primary">
                    {(userTokens - (selectedReward?.tokenCost ?? 0)).toLocaleString()}
                    <Coins className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>

              <DialogFooter className="sm:justify-end gap-2">
                <Button variant="outline" onClick={closeDialog} disabled={isRedeeming}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  data-testid="confirm-redeem-btn"
                  className="transition-all active:scale-95"
                >
                  {isRedeeming ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    "Confirm Request"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <SuccessAnimation size={56} />
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Request Submitted!</h3>
                <p className="text-sm text-muted-foreground max-w-[260px]">
                  Your redemption request has been sent to HC PM for verification. Track its
                  status in History.
                </p>
              </div>

              {/* Pipeline */}
              <div className="w-full max-w-xs pt-2">
                <RedemptionPipeline currentStep="submitted" />
              </div>

              <Button onClick={closeDialog} className="mt-2 w-full" data-testid="done-btn">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
