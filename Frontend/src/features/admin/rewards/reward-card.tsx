"use client";

import { Box, PackageX, Eye, EyeOff, Edit, Trash2, Coins } from "lucide-react";
import type { RewardCatalogItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface RewardCardProps {
  reward: RewardCatalogItem;
  onEdit: (reward: RewardCatalogItem) => void;
  onToggleStatus: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function RewardCard({ reward, onEdit, onToggleStatus, onDelete }: RewardCardProps) {
  const isOutOfStock = reward.stock !== null && reward.stock <= 0;

  const getTierStyles = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case "SAPHIRE":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "EMERALD":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "RUBY":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "DIAMOND":
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };
  
  return (
    <div
      data-testid={`reward-card-${reward.id}`}
      className={`bento-card p-0 flex flex-col h-full transition-all duration-300 group transform-gpu
      ${!reward.isActive ? "opacity-75" : ""}
    `}
    >
      {/* Thumbnail / Icon area */}
      <div className="aspect-[16/9] bg-[var(--color-surface-elevated)] relative overflow-hidden flex items-center justify-center border-b border-[var(--color-border-subtle)]">
        {reward.imageUrl ? (
          <img 
            src={reward.imageUrl} 
            alt={reward.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="text-[var(--color-text-disabled)] opacity-30 group-hover:scale-110 transition-transform duration-500">
            {isOutOfStock ? <PackageX size={48} /> : <Box size={48} />}
          </div>
        )}
        
        {/* Badges on top of image */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm
            ${reward.isActive 
              ? "bg-primary/10 text-primary border-primary/20" 
              : "bg-neutral-900/10 text-neutral-600 border-neutral-200"}
          `}>
            {reward.isActive ? "Visible" : "Hidden"}
          </span>
        </div>

        {isOutOfStock && (
          <div className="absolute top-3 right-3">
             <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg uppercase tracking-wider">
               Out of Stock
             </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        {/* Content */}
        <div className="flex-grow">
          <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-1.5 line-clamp-1 group-hover:text-primary transition-colors" title={reward.name}>
            {reward.name}
          </h3>
          <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2 min-h-[40px] leading-relaxed">
            {reward.description || "No description provided for this reward item."}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3 py-4 mt-4 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 font-bold">Cost</span>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-black leading-none">
                  {reward.tokenCost.toLocaleString()}
                </span>
                <Coins className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 font-bold">Stock</span>
               <span className={`text-base font-extrabold leading-none ${isOutOfStock ? "text-red-600" : "text-[var(--color-text-primary)]"}`}>
                 {reward.stock === null ? "Unlimited" : reward.stock.toLocaleString()}
               </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">Min Tier</span>
            <span className={cn(
              "text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm uppercase tracking-wider",
              getTierStyles(reward.minTier)
            )}>
              {reward.minTier || "SAPHIRE"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center gap-2 mt-auto">
          <button
            onClick={() => onEdit(reward)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border-subtle)] rounded-xl transition-all border border-[var(--color-border-subtle)] shadow-sm"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          
          <button
            onClick={() => onToggleStatus(reward.id, !reward.isActive)}
            className={cn(
              "inline-flex items-center justify-center p-2.5 rounded-xl transition-all border border-[var(--color-border-subtle)] shadow-sm",
              reward.isActive 
                ? "text-[var(--color-text-tertiary)] bg-[var(--color-surface-elevated)] hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/30" 
                : "text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20"
            )}
            title={reward.isActive ? "Hide Reward" : "Show Reward"}
          >
            {reward.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onDelete(reward.id)}
            className="inline-flex items-center justify-center p-2.5 text-[var(--color-error)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-error)]/10 border border-[var(--color-border-subtle)] hover:border-[var(--color-error)]/30 rounded-xl transition-all shadow-sm"
            title="Delete Permanently"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
