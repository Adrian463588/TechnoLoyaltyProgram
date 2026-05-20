"use client";

import { Box, PackageX, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
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
  
  return (
    <div className={`bento-card p-6 flex flex-col h-full transition-all duration-300 group transform-gpu
      ${!reward.isActive ? "opacity-75" : ""}
    `}>
      {/* Header section with Icon & Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl flex-shrink-0
          ${reward.isActive ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]" : "bg-[var(--color-surface-elevated)] text-[var(--color-text-disabled)]"}
        `}>
          {isOutOfStock ? <PackageX className="w-6 h-6" /> : <Box className="w-6 h-6" />}
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border
          ${reward.isActive 
            ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-border-accent)]" 
            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]"}
        `}>
          {reward.isActive ? "Visible" : "Hidden"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-grow">
        <h3 className="text-[var(--color-text-primary)] font-semibold text-lg mb-1.5 line-clamp-1" title={reward.name}>
          {reward.name}
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2 min-h-[40px]">
          {reward.description || "No description"}
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 py-4 mt-2 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Cost</span>
            <span className="text-xl font-bold text-[var(--color-accent)] leading-none font-mono">
              {reward.tokenCost.toLocaleString()} <span className="text-sm font-normal text-[var(--color-text-secondary)]">tokens</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Stock</span>
             <span className={`text-sm font-medium leading-none ${isOutOfStock ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]"}`}>
               {reward.stock === null ? "Unlimited" : reward.stock.toLocaleString()}
             </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Min Tier</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
            {reward.minTier || "SAPHIRE"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center gap-2 mt-auto">
        <button
          onClick={() => onEdit(reward)}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border-subtle)] rounded-lg transition-colors border border-[var(--color-border-subtle)]"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        
        <button
          onClick={() => onToggleStatus(reward.id, !reward.isActive)}
          className={cn(
            "inline-flex items-center justify-center p-2 rounded-lg transition-colors border border-[var(--color-border-subtle)]",
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
          className="inline-flex items-center justify-center p-2 text-[var(--color-error)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-error)]/10 border border-[var(--color-border-subtle)] hover:border-[var(--color-error)]/30 rounded-lg transition-colors"
          title="Delete Permanently"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
