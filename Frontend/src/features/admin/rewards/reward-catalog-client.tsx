"use client";

import { useState, useMemo } from "react";
import { Plus, Gift, Search } from "lucide-react";
import type { RewardCatalogItem } from "@/lib/api-client";
import { RewardCard } from "./reward-card";
import { RewardFormModal } from "./reward-form-modal";
import { DeleteRewardModal } from "./delete-reward-modal";
import { createRewardAction, updateRewardAction, toggleRewardStatusAction, deleteRewardAction } from "./actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RewardCatalogClientProps {
  initialRewards: RewardCatalogItem[];
}

export function RewardCatalogClient({ initialRewards }: RewardCatalogClientProps) {
  const [rewards, setRewards] = useState<RewardCatalogItem[]>(initialRewards);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardCatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; rewardId: string | null; rewardName: string }>({
    open: false,
    rewardId: null,
    rewardName: "",
  });

  const filteredRewards = useMemo(() => {
    if (!searchQuery) return rewards;
    const lowerQuery = searchQuery.toLowerCase();
    return rewards.filter(
      (r) => 
        r.name.toLowerCase().includes(lowerQuery) || 
        (r.description && r.description.toLowerCase().includes(lowerQuery))
    );
  }, [rewards, searchQuery]);

  const handleCreateNew = () => {
    setEditingReward(null);
    setIsModalOpen(true);
  };

  const handleEdit = (reward: RewardCatalogItem) => {
    setEditingReward(reward);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string, active: boolean) => {
    try {
      const updated = await toggleRewardStatusAction(id, active);
      setRewards((prev) => prev.map(r => r.id === id ? updated : r));
      toast.success(`Reward ${active ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteTrigger = (reward: RewardCatalogItem) => {
    setDeleteConfirm({
      open: true,
      rewardId: reward.id,
      rewardName: reward.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.rewardId) return;
    
    setIsDeleting(true);
    try {
      await deleteRewardAction(deleteConfirm.rewardId);
      setRewards((prev) => prev.filter(r => r.id !== deleteConfirm.rewardId));
      toast.success("Reward deleted successfully");
      setDeleteConfirm({ open: false, rewardId: null, rewardName: "" });
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingReward) {
        const updated = await updateRewardAction(editingReward.id, data);
        setRewards((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        toast.success("Reward updated successfully");
      } else {
        const created = await createRewardAction(data);
        setRewards((prev) => [created, ...prev]);
        toast.success("Reward created successfully");
      }
    } catch (err: any) {
      toast.error(`Operation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bento-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-up-in">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search rewards by name, category..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="mt-6 md:mt-0">
          <button
            onClick={handleCreateNew}
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Reward
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredRewards.length === 0 ? (
        <div className="bento-card p-12 text-center animate-fade-up-in" style={{ animationDelay: "100ms" }}>
          {searchQuery ? (
             <>
               <Search className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
               <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No results found</h3>
                <p className="text-[var(--color-text-secondary)] max-w-sm mx-auto">
                  We couldn&apos;t find any rewards matching &quot;{searchQuery}&quot;.
                </p>
               <button 
                 onClick={() => setSearchQuery("")}
                 className="mt-4 text-sm font-bold text-primary hover:underline"
               >
                 Clear search
               </button>
             </>
          ) : (
            <>
              <Gift className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No rewards yet</h3>
              <p className="text-[var(--color-text-secondary)] max-w-sm mx-auto">
                Click the Add Reward button to create the first item in your catalog.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-up-in" style={{ animationDelay: "100ms" }}>
          {filteredRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={() => handleDeleteTrigger(reward)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <RewardFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteTrigger}
        initialData={editingReward}
      />

      {/* Delete Confirmation Modal */}
      <DeleteRewardModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, rewardId: null, rewardName: "" })}
        onConfirm={handleConfirmDelete}
        rewardName={deleteConfirm.rewardName}
        isDeleting={isDeleting}
      />
    </div>
  );
}
