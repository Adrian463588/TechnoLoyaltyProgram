"use client";

import { useState } from "react";
import { Plus, Gift } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardCatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; rewardId: string | null; rewardName: string }>({
    open: false,
    rewardId: null,
    rewardName: "",
  });

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
      toast.success(`Reward ${active ? 'activated' : 'deactivated'} successfully`, {
        style: {
          background: "#10b981",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
        },
      });
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`, {
        style: {
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
        },
      });
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
      toast.success("Reward deleted successfully", {
        style: {
          background: "#10b981",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
        },
      });
      setDeleteConfirm({ open: false, rewardId: null, rewardName: "" });
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`, {
        style: {
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
        },
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingReward) {
        const updated = await updateRewardAction(editingReward.id, data);
        setRewards((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        toast.success("Reward updated successfully", {
          style: { background: "#10b981", color: "#fff", border: "none", borderRadius: "12px" },
        });
      } else {
        const created = await createRewardAction(data);
        setRewards((prev) => [created, ...prev]);
        toast.success("Reward created successfully", {
          style: { background: "#10b981", color: "#fff", border: "none", borderRadius: "12px" },
        });
      }
    } catch (err: any) {
      toast.error(`Operation failed: ${err.message}`, {
        style: { background: "#ef4444", color: "#fff", border: "none", borderRadius: "12px" },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bento-card p-6 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
        <div>
          <h1 className="text-card-heading text-2xl mb-1 flex items-center gap-3">
            <Gift className="h-6 w-6 text-[--color-accent]" />
            Reward Catalog
          </h1>
          <p className="text-[--color-text-secondary]">
            Manage the list of rewards available for Mitra to redeem. Add items, update costs, and track stock.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
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
      {rewards.length === 0 ? (
        <div className="bento-card p-12 text-center animate-fade-up-in" style={{ animationDelay: "100ms" }}>
          <Gift className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No rewards yet</h3>
          <p className="text-[var(--color-text-secondary)] max-w-sm mx-auto">
            Click the Add Reward button to create the first item in your catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-up-in" style={{ animationDelay: "100ms" }}>
          {rewards.map((reward) => (
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
