"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { RewardItem, MembershipTier } from "@/types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { SuccessAnimation } from "@/components/shared/success-animation";
import { RedemptionPipeline } from "@/components/shared/redemption-pipeline";
import { TierBadge } from "@/components/shared/status-badge";
import { Coins, Lock, ShoppingBag, Loader2, FileText, Upload, Check, Trash2, AlertCircle, ArrowRight, X, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { employeeApi } from "@/lib/api-client";
import { submitRedemptionRequest } from "@/features/redemptions/actions";

interface RewardsClientProps {
  rewards: RewardItem[];
  userTokens: number;
  isEligible: boolean;
  userTier: MembershipTier;
  token: string;
}

const TIER_RANK: Record<MembershipTier, number> = {
  "SAPHIRE": 0,
  "EMERALD": 1,
  "RUBY": 2,
  "DIAMOND": 3
};

const REQUIRED_DOCS = [
  { type: "ID_CARD_MITRA", label: "ID Card Mitra" },
  { type: "KTP", label: "KTP (Identity Card)" },
  { type: "NPWP", label: "NPWP (Tax ID)" },
];

export default function RewardsClient({ rewards, userTokens, isEligible, userTier, token }: RewardsClientProps) {
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Document validation states
  const [isCheckingDocs, setIsCheckingDocs] = useState(false);
  const [missingDocs, setMissingDocs] = useState<string[]>([]);
  const [showIncompleteDocsModal, setShowIncompleteDocsModal] = useState(false);

  // Pickup representation states
  const [isRepresented, setIsRepresented] = useState(false);
  const [poaFile, setPoaFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setPoaFile(files[0] || null),
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/heic': ['.heic'],
    },
    maxFiles: 1,
    multiple: false
  });

  const handleInitiateRedeem = async (reward: RewardItem) => {
    setIsCheckingDocs(true);
    try {
      const docs = await employeeApi.getDocuments(token);
      const uploadedTypes = new Set(docs.map(d => d.type));
      const missing = REQUIRED_DOCS
        .filter(rd => !uploadedTypes.has(rd.type as "ID_CARD_MITRA" | "KTP" | "NPWP"))
        .map(rd => rd.label);      
      if (missing.length > 0) {
        setMissingDocs(missing);
        setShowIncompleteDocsModal(true);
      } else {
        setMissingDocs([]);
        setSelectedReward(reward);
      }
    } catch {
      toast.error("Gagal memverifikasi kelengkapan dokumen.");
    } finally {
      setIsCheckingDocs(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;
    
    if (isRepresented && !poaFile) {
      toast.error("Silakan unggah Surat Kuasa terlebih dahulu.");
      return;
    }

    setIsRedeeming(true);
    
    try {
      const result = await submitRedemptionRequest({ 
        rewardItemId: selectedReward.id,
        isRepresented,
        file: poaFile || undefined
      });
      
      if (result.success) {
        setSuccess(true);
        toast.success("Permintaan hadiah berhasil dikirim!");
      } else {
        toast.error(result.error ?? "Gagal mengirim permintaan");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Terjadi kesalahan tak terduga. Silakan coba lagi.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const closeDialog = () => {
    if (!isRedeeming) {
      setSelectedReward(null);
      setIsRepresented(false);
      setPoaFile(null);
      setMissingDocs([]);
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
      
      {/* Global Loader for Doc Checking */}
      {isCheckingDocs && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <BentoCard className="p-8 flex flex-col items-center gap-4 bg-white/90 shadow-2xl scale-110">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">Memvalidasi dokumen...</p>
          </BentoCard>
        </div>
      )}

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
          const isOutOfStock = reward.stock !== null && reward.stock <= 0;
          const tierMet = TIER_RANK[userTier] >= TIER_RANK[reward.minTier];
          const canRedeem = canAfford && isAvailable && tierMet && !isOutOfStock;

          return (
            <BentoCard
              key={reward.id}
              className={cn(
                "flex flex-col h-full animate-fade-up-in transform-gpu will-change-transform p-0 overflow-hidden group",
                !canRedeem && "bg-neutral-50/50"
              )}
              style={{ animationDelay: `${i * 40}ms` } as React.CSSProperties}
            >
                {/* Thumbnail area */}
                <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden flex items-center justify-center border-b border-border">
                  {reward.imageUrl ? (
                    <img 
                      src={reward.imageUrl} 
                      alt={reward.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <ShoppingBag className="w-14 h-14 text-muted-foreground" />
                    </div>
                  )}

                  {/* Stock indicator badge */}
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-2 z-10">
                    {reward.stock === null ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-emerald-600 border border-emerald-100 shadow-sm">
                        <Check size={10} strokeWidth={3} />
                        Ready Stock
                      </span>
                    ) : isOutOfStock ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white border border-red-700 shadow-sm">
                        Out of Stock
                      </span>
                    ) : reward.stock <= 5 ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 shadow-sm animate-pulse">
                        <AlertCircle size={10} />
                        Only {reward.stock} left!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-slate-600 border border-slate-200 shadow-sm">
                        <Package size={10} />
                        {reward.stock} in stock
                      </span>
                    )}
                  </div>

                  {/* Status Overlays */}
                  {!isAvailable && !isOutOfStock && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                      <span className="inline-flex items-center rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-900 text-white shadow-xl">
                        Unavailable
                      </span>
                    </div>
                  )}
                  {!tierMet && isAvailable && !isOutOfStock && (
                    <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest border border-orange-200 px-4 py-1.5 shadow-lg">
                        <Lock className="w-3.5 h-3.5" />
                        Tier Locked
                      </span>
                    </div>
                  )}
                  {!canAfford && tierMet && isAvailable && !isOutOfStock && (
                    <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest border border-red-200 px-4 py-1.5 shadow-lg">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Insufficient Tokens
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 space-y-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {reward.category}
                      </span>
                      <TierBadge tier={reward.minTier} className="text-[10px] py-1 px-3 h-auto opacity-100" />
                    </div>
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
                        "flex items-center font-extrabold text-lg",
                        canAfford ? "text-primary" : "text-red-500"
                      )}
                    >
                      {reward.tokenCost.toLocaleString()}
                      <Coins className="w-[18px] h-[18px] ml-1.5" />
                    </div>

                    {canRedeem ? (
                      <Button
                        size="sm"
                        onClick={() => handleInitiateRedeem(reward)}
                        data-testid={`redeem-btn-${reward.id}`}
                        className="transition-all hover:scale-105 active:scale-95 px-4"
                      >
                        Redeem
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled
                        data-testid={`redeem-btn-${reward.id}`}
                        className="cursor-not-allowed bg-neutral-200 text-neutral-400 border-none"
                      >
                        {!tierMet ? "Locked" : "Redeem"}
                      </Button>
                    )}
                  </div>
                </div>
              </BentoCard>
          );
        })}
      </div>

      {/* 1. Incomplete Documents Modal */}
      <Dialog open={showIncompleteDocsModal} onOpenChange={setShowIncompleteDocsModal}>
        <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl p-0 overflow-hidden max-w-sm">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
              <AlertCircle size={32} />
            </div>
            <DialogHeader className="mb-0 p-0 text-center">
              <DialogTitle className="text-xl font-extrabold text-neutral-900 text-center">Data Belum Lengkap</DialogTitle>
              <DialogDescription className="text-neutral-500 text-sm leading-relaxed text-center mt-2">
                Maaf, Anda belum bisa melakukan penukaran. Mohon lengkapi dokumen identitas berikut di menu <span className="font-bold text-neutral-700">My Documents</span>:
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-2">
              {missingDocs.map(doc => (
                <div key={doc} className="py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
                  <X size={14} className="text-red-500" />
                  {doc}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 flex flex-col gap-2 mt-0">
            <Link href={"/employee/documents" as any} className="w-full">
              <Button className="w-full py-6 rounded-xl font-bold gap-2">
                Lengkapi Sekarang
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={() => setShowIncompleteDocsModal(false)}
              className="w-full rounded-xl text-neutral-500 font-bold hover:bg-neutral-100 transition-colors"
            >
              Nanti Saja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Confirm Redemption Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={closeDialog}>
        <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl p-0 overflow-hidden max-w-lg">
          {!success ? (
            <>
              <div className="p-8 max-h-[85vh] overflow-y-auto hide-scrollbar">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-[var(--color-accent)]/10 rounded-xl text-[var(--color-accent)]">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-neutral-900 text-left">Confirm Redemption</DialogTitle>
                  </div>
                  <DialogDescription className="text-neutral-600 text-sm leading-relaxed text-left">
                    Anda akan menukarkan token Anda dengan hadiah ini. Permintaan ini akan dikirim ke tim HC untuk verifikasi.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Item Summary */}
                  <div className="p-5 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Item Selected</p>
                      <h4 className="font-bold text-neutral-900 text-base">{selectedReward?.name}</h4>
                    </div>
                    
                    <div className="space-y-2 pt-4 border-t border-neutral-200/60">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Saldo Saat Ini</span>
                        <span className="font-mono font-medium text-neutral-900">
                          {userTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Biaya Penukaran</span>
                        <span className="font-mono font-bold flex items-center text-red-600">
                          −{selectedReward?.tokenCost.toLocaleString()}
                          <Coins className="w-3.5 h-3.5 ml-1.5" />
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-neutral-300 mt-2">
                        <span className="font-semibold text-neutral-700">Saldo Akhir</span>
                        <span className="font-mono font-bold flex items-center text-[var(--color-accent)] text-base">
                          {(userTokens - (selectedReward?.tokenCost ?? 0)).toLocaleString()}
                          <Coins className="w-3.5 h-3.5 ml-1.5" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Representative Checkbox */}
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input
                          type="checkbox"
                          checked={isRepresented}
                          onChange={(e) => {
                            setIsRepresented(e.target.checked);
                            if (!e.target.checked) setPoaFile(null);
                          }}
                          className="peer h-5 w-5 appearance-none rounded-lg border-2 border-slate-200 checked:border-primary checked:bg-primary transition-all cursor-pointer"
                        />
                        <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                          Diterima oleh wakil (Diwakilkan)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Pilih jika Anda tidak dapat mengambil hadiah sendiri.
                        </span>
                      </div>
                    </label>

                    {/* POA Upload Area */}
                    {isRepresented && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {poaFile ? (
                          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between group">
                            <div className="flex items-center gap-3 truncate">
                              <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-primary/10 shrink-0 shadow-sm">
                                <FileText size={20} className="text-primary" />
                              </div>
                              <div className="flex flex-col truncate">
                                <span className="text-xs font-bold text-slate-800 truncate">{poaFile.name}</span>
                                <span className="text-[10px] text-primary/60 font-medium">Siap diunggah</span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:bg-red-50"
                              onClick={() => setPoaFile(null)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            {...getRootProps()}
                            className={cn(
                              "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                              isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                            )}
                          >
                            <input {...getInputProps()} />
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                              <Upload size={20} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 mb-1">Unggah Surat Kuasa</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              PNG, JPG, HEIC dengan tanda tangan & materai (Max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    )}
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
                  Batal
                </Button>
                <Button
                  onClick={handleRedeem}
                  disabled={isRedeeming || (isRepresented && !poaFile)}
                  data-testid="confirm-redeem-btn"
                  className="flex-1 btn-primary rounded-xl font-semibold shadow-md active:scale-95 ml-3"
                >
                  {isRedeeming ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses…
                    </span>
                  ) : (
                    "Konfirmasi"
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
                <h3 className="text-2xl font-bold text-neutral-900">Permintaan Terkirim!</h3>
                <p className="text-neutral-500 text-sm max-w-[300px] leading-relaxed mx-auto">
                  Permintaan penukaran hadiah Anda telah dikirim ke tim HC untuk verifikasi. Mohon menunggu konfirmasi dari pihak HC.
                </p>
              </div>

              <Button
                onClick={closeDialog}
                className="w-full btn-primary rounded-xl font-semibold py-6 text-base"
                data-testid="done-btn"
              >
                Okay
              </Button>            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
