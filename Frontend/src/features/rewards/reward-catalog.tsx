"use client";

import React, { useState } from "react";
import { Coins, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { RedemptionModal } from "./redemption-modal";
import { motion } from "framer-motion";

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  imageUrl?: string;
}

const MOCK_REWARDS: RewardItem[] = [
  { id: "1", name: "Starbucks Voucher", description: "Rp 50.000 Digital Voucher", tokenCost: 50 },
  { id: "2", name: "Cinema XXI Ticket", description: "1x Regular Ticket", tokenCost: 100 },
  { id: "3", name: "Wireless Mouse", description: "Logitech B170", tokenCost: 500 },
  { id: "4", name: "Mechanical Keyboard", description: "Keychron K8 Pro", tokenCost: 1500 },
  { id: "5", name: "Smart TV 32\"", description: "Xiaomi TV A2", tokenCost: 8000 },
];

export function RewardCatalog({ userTokens }: { userTokens: number }) {
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_REWARDS.map((reward, i) => {
          const canAfford = userTokens >= reward.tokenCost;
          
          return (
            <div 
              key={reward.id} 
              className={cn(
                "bento-card p-5 flex flex-col justify-between animate-fade-up-in",
                !canAfford && "opacity-75 grayscale-[30%]"
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                <div className="h-32 w-full bg-[--color-border-subtle] rounded-xl mb-4 flex items-center justify-center text-[--color-text-disabled]">
                  <ShoppingBag size={32} />
                </div>
                <h4 className="text-[--color-text-primary] font-semibold text-lg">{reward.name}</h4>
                <p className="text-[--color-text-secondary] text-sm mt-1 mb-4">{reward.description}</p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-[--color-border-subtle] flex items-center justify-between">
                <span className={cn(
                  "font-mono font-bold flex items-center gap-1",
                  canAfford ? "text-[--color-accent]" : "text-[--color-text-disabled]"
                )}>
                  <Coins size={14} />
                  {reward.tokenCost}
                </span>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  disabled={!canAfford}
                  onClick={() => setSelectedReward(reward)}
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-lg transition-colors font-medium",
                    canAfford 
                      ? "bg-[--color-accent-muted] text-[--color-accent] border border-[--color-border-accent] hover:bg-[--color-accent] hover:text-[#0F172A] shadow-[0_0_12px_rgba(107,206,83,0.15)] hover:shadow-[0_4px_16px_rgba(107,206,83,0.35)]" 
                      : "bg-black/20 text-[--color-text-disabled] cursor-not-allowed border border-transparent"
                  )}
                >
                  Redeem
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedReward && (
        <RedemptionModal 
          reward={selectedReward}
          userTokens={userTokens}
          onClose={() => setSelectedReward(null)} 
        />
      )}
    </>
  );
}
