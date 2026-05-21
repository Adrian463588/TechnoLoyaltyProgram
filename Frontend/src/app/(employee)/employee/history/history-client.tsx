"use client";

import { useState } from "react";
import { TokenLedgerEntryResponse, RedemptionResponse, employeeApi } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { PipelineStep } from "@/components/shared/redemption-pipeline";
import { Coins, History, Clock, TrendingUp, ShoppingBag, Gift, Zap, Info, X, ExternalLink, ShieldCheck, Check, Loader2, User, FileText, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HistoryClientProps {
  entries: TokenLedgerEntryResponse[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  redemptions: RedemptionResponse[];
  sessionToken: string;
}

const STATUS_TO_STEP: Record<string, PipelineStep> = {
  REQUESTED: "submitted",
  REVIEWED:  "review",
  ACCEPTED:  "accepted",
  REJECTED:  "submitted",
  CANCELLED: "submitted",
};

export function HistoryClient({ entries, totalCount, currentPage, totalPages, redemptions, sessionToken }: HistoryClientProps) {
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string, label: string } | null>(null);

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm("Apakah Anda yakin ingin membatalkan penukaran ini? Token Anda akan dikembalikan secara otomatis.")) return;
    
    setIsUpdating(true);
    try {
      await employeeApi.cancelRedemption(sessionToken, id);
      toast.success("Penukaran berhasil dibatalkan");
      setTimeout(() => {
         window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan penukaran");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "font-black text-[8px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-lg border flex items-center w-fit gap-1 shadow-sm";
    switch (status) {
      case "REQUESTED":
        return <span className={cn(base, "bg-orange-50 text-orange-600 border-orange-200")}>Requested</span>;
      case "REVIEWED":
        return <span className={cn(base, "bg-blue-50 text-blue-600 border-blue-200")}>Reviewed</span>;
      case "ACCEPTED":
        return <span className={cn(base, "bg-emerald-50 text-emerald-600 border-emerald-200")}>Accepted</span>;
      case "REJECTED":
        return <span className={cn(base, "bg-red-50 text-red-600 border-red-100")}>Rejected</span>;
      case "CANCELLED":
        return <span className={cn(base, "bg-slate-50 text-slate-400 border-slate-200")}>Cancelled</span>;
      default:
        return null;
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEventMetadata = (type: string) => {
    switch (type) {
      case "EARNED_SHIFT":
        return { label: "Monthly Token Award", icon: TrendingUp, color: "text-success", bg: "bg-success/10", border: "border-success/20" };
      case "EARNED_PROJECT":
        return { label: "Project Completion Bonus", icon: Gift, color: "text-success", bg: "bg-success/10", border: "border-success/20" };
      case "REDEEMED":
        return { label: "Reward Redemption", icon: ShoppingBag, color: "text-error", bg: "bg-error/10", border: "border-error/20" };
      case "MANUAL_ADJUSTMENT":
        return { label: "Token Adjustment", icon: Coins, color: "text-info", bg: "bg-info/10", border: "border-info/20" };
      case "DOWNGRADE_PENALTY":
        return { label: "Tier Downgrade", icon: Clock, color: "text-error", bg: "bg-error/10", border: "border-error/20" };
      case "RESET_PENALTY":
        return { label: "Period Reset", icon: Clock, color: "text-error", bg: "bg-error/10", border: "border-error/20" };
      case "EXPIRED":
        return { label: "Token Expired", icon: Clock, color: "text-muted", bg: "bg-slate-100", border: "border-slate-200" };
      default:
        return { label: type.replace(/_/g, ' '), icon: Zap, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
    }
  };

  const getDocUrl = (url: string) => {
    return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/${url}`;
  };

  return (
    <>
      <BentoCard className="p-0 overflow-hidden shadow-sm border-[var(--color-border-subtle)] animate-fade-up-in" style={{ animationDelay: "200ms" }}>
        <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Ledger Activity</span>
          </div>
          <Badge variant="outline" className="rounded-md bg-[var(--color-surface-base)] px-3 py-1 font-mono text-[var(--color-text-secondary)]">
            Page {currentPage} of {totalPages}
          </Badge>
        </div>

        {entries.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center gap-4 bg-white">
            <div className="p-6 bg-slate-50 rounded-2xl text-slate-300">
              <History className="w-12 h-12" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-black">No activity recorded</h2>
              <p className="text-sm text-muted mt-2 max-w-xs mx-auto">
                Once you start earning or redeeming tokens, your transaction history will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto hide-scrollbar bg-white">
              <Table className="min-w-[900px]">
                <TableHeader className="bg-[var(--color-surface-elevated)]/50">
                  <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                    <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Transaction Date</TableHead>
                    <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Activity Type</TableHead>
                    <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Reward</TableHead>
                    <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-right">Amount</TableHead>
                    <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-center">Track</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const meta = getEventMetadata(entry.eventType);
                    const Icon = meta.icon;
                    const isAddition = entry.amount > 0;
                    const isRedemption = entry.eventType === "REDEEMED";
                    const redemption = isRedemption ? redemptions.find(r => r.id === entry.referenceId) : null;

                    return (
                      <TableRow
                        key={entry.id}
                        className={cn(
                          "group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05]"
                        )}
                      >
                        <TableCell className="py-5 px-6 text-sm text-[var(--color-text-secondary)]">
                          {formatDate(entry.createdAt)}
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", meta.bg, meta.color, meta.border)}>
                              <Icon size={18} />
                            </div>
                            <span className="text-sm font-semibold text-[--color-text-secondary] group-hover:text-[--color-text-primary] transition-colors">
                              {meta.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          {redemption ? (
                            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                              {redemption.item?.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 font-medium italic">General Transaction</span>
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-6 text-right">
                          <span className={cn(
                            "text-sm font-bold font-mono px-3 py-1 rounded-lg",
                            isAddition ? "text-success bg-success/5" : "text-error bg-error/5"
                          )}>
                            {isAddition ? `+${entry.amount.toLocaleString()}` : entry.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-center">
                           {isRedemption ? (
                             <button
                               onClick={() => setSelectedRedemption(redemption || null)}
                               className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20 active:scale-95 inline-flex items-center gap-2 group/btn"
                               title="Track Progress"
                             >
                               <ExternalLink size={18} className="group-hover/btn:scale-110 transition-transform" />
                             </button>
                           ) : (
                             <span className="text-slate-200">—</span>
                           )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalCount}
            />
          </>
        )}
      </BentoCard>

      {/* Track Redemption Modal — TRUE HORIZONTAL MIRROR OF ADMIN UI */}
      {selectedRedemption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white border border-white/20 rounded-[32px] shadow-[0_32px_120px_-16px_rgba(0,0,0,0.3)] w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            
            {/* Layer 1: Horizontal Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <ShoppingBag size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Redemption Review Center</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-slate-900 text-white border-none rounded-lg px-2 py-0.5 text-[10px] font-mono">#{selectedRedemption.id.split('-')[0].toUpperCase()}</Badge>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Transaction Tracking</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className={cn(
                    "hidden sm:flex px-4 py-2 rounded-2xl border font-black text-[10px] uppercase tracking-widest items-center gap-2",
                    selectedRedemption.isRepresented 
                      ? "bg-amber-50 text-amber-600 border-amber-100 shadow-sm" 
                      : "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm"
                  )}>
                    <User size={14} />
                    {selectedRedemption.isRepresented ? "Representative Pickup" : "Direct Pickup"}
                  </div>
                <button
                  onClick={() => setSelectedRedemption(null)}
                  className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Layer 2: Horizontal Journey Row */}
            <div className="px-8 py-8 bg-slate-50/50 border-b border-slate-100 flex-shrink-0">
               <div className="max-w-4xl mx-auto w-full">
                  <div className="flex items-center justify-between relative px-4">
                    {[
                      { key: "submitted", label: "Request Sent", icon: Check },
                      { key: "review",    label: "Document Review", icon: Info },
                      { key: "accepted",  label: "Confirmation", icon: ShieldCheck }
                    ].map((step, idx) => {
                      const currentStep = STATUS_TO_STEP[selectedRedemption.status] || "submitted";
                      const steps = ["submitted", "review", "accepted"];
                      const currentIdx = steps.indexOf(currentStep);
                      const isDone = currentIdx > idx || (currentStep === "accepted" && idx === 2);
                      const isActive = currentStep === step.key && currentStep !== "accepted";

                      return (
                        <div key={step.key} className="flex flex-col items-center gap-3 relative z-10 flex-1">
                          {idx < 2 && (
                            <div className={cn(
                              "absolute left-[calc(50%+25px)] top-5 w-[calc(100%-50px)] h-1 rounded-full transition-colors duration-1000",
                              isDone ? "bg-primary" : "bg-slate-200"
                            )} />
                          )}
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                            isDone ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110" : 
                            isActive ? "bg-white border-primary text-primary shadow-xl scale-125" : 
                            "bg-white border-slate-200 text-slate-300"
                          )}>
                            {isDone ? <Check size={20} strokeWidth={4} /> : <step.icon size={20} />}
                          </div>
                          <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest text-center mt-1 transition-colors",
                            isDone || isActive ? "text-slate-900" : "text-slate-400"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>

            {/* Layer 3: Main Horizontal Content Grid */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 hide-scrollbar bg-white">
              
              {/* Row A: Summary Strip (Mirror Admin) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                 <div className="sm:col-span-8 p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                         <ShoppingBag size={32} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Reward</p>
                          <h4 className="text-xl font-black text-slate-900 leading-tight">{selectedRedemption.item?.name || "N/A"}</h4>
                       </div>
                    </div>
                    <div className="h-12 w-px bg-slate-100 mx-6 hidden lg:block" />
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Token Cost</p>
                       <div className="flex items-center justify-end gap-1.5 text-2xl font-black text-primary font-mono">
                          {selectedRedemption.item?.tokenCost?.toLocaleString() || 0}
                          <Coins size={20} />
                       </div>
                    </div>
                 </div>

                 {(() => {
                   const statusConfig: Record<string, { bg: string, text: string, label: string, pulse?: string }> = {
                     REQUESTED: { bg: "bg-orange-50 border-orange-200", text: "text-orange-600", label: "Requested", pulse: "bg-orange-500" },
                     REVIEWED: { bg: "bg-blue-50 border-blue-200", text: "text-blue-600", label: "Reviewed" },
                     ACCEPTED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-600", label: "Accepted" },
                     REJECTED: { bg: "bg-red-50 border-red-200", text: "text-red-600", label: "Rejected" },
                     CANCELLED: { bg: "bg-slate-50 border-slate-200", text: "text-slate-500", label: "Cancelled" },
                   };
                   const config = statusConfig[selectedRedemption.status] || statusConfig.CANCELLED;

                   return (
                     <div className={cn("sm:col-span-4 p-8 border rounded-[32px] flex flex-col justify-center items-center text-center shadow-sm transition-all", config.bg, config.text)}>
                        <div className="flex items-center gap-3">
                           {config.pulse && <span className={cn("inline-block w-2.5 h-2.5 rounded-full animate-pulse shadow-sm", config.pulse)} />}
                           <span className="font-black text-lg tracking-[0.1em] uppercase">{config.label}</span>
                        </div>
                     </div>
                   );
                 })()}
              </div>

              {/* PHASE 1: DOCUMENT REVIEW (Mirror Admin) */}
              {selectedRedemption.status === "REQUESTED" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="flex items-center gap-3">
                       <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Identity Verification Status</h3>
                       <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                       {[
                         { label: "National ID (KTP)", type: "KTP", icon: FileText, color: "blue", verified: selectedRedemption.ktpVerified },
                         { label: "Partner ID Card", type: "ID_CARD_MITRA", icon: ShieldCheck, color: "indigo", verified: selectedRedemption.idCardVerified },
                         { label: "Tax Card (NPWP)", type: "NPWP", icon: Coins, color: "slate", verified: selectedRedemption.npwpVerified },
                       ].map(doc => {
                         const userDoc = selectedRedemption.mitra?.documents?.find(d => d.type === doc.type);
                         return (
                           <div key={doc.type} className="group relative p-6 rounded-[28px] border border-slate-200 bg-white hover:border-primary hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full">
                              <div className="flex items-start justify-between mb-4">
                                 <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors group-hover:bg-primary/10 group-hover:text-primary", 
                                   doc.color === "blue" ? "bg-blue-50 text-blue-600" :
                                   doc.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                                   "bg-slate-100 text-slate-600"
                                 )}>
                                    <doc.icon size={24} />
                                 </div>
                                 {doc.verified ? (
                                   <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                     <Check size={12} strokeWidth={4} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                                   </div>
                                 ) : userDoc ? (
                                   <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100">
                                     <Clock size={12} strokeWidth={3} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">Pending Review</span>
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100">
                                     <X size={12} strokeWidth={4} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">Missing</span>
                                   </div>
                                 )}
                              </div>
                              <p className="text-sm font-black text-slate-900 mb-1">{doc.label}</p>
                              <p className="text-[10px] text-slate-500 font-medium mb-8 leading-relaxed">Document status in system.</p>
                              
                              <div className="mt-auto">
                                {userDoc ? (
                                  <Button 
                                    className="w-full bg-slate-900 hover:bg-primary text-white rounded-2xl h-12 font-bold text-xs gap-2 transition-all shadow-lg hover:shadow-primary/25"
                                    onClick={() => setPreviewDoc({ url: userDoc.fileUrl, label: doc.label })}
                                  >
                                    <Eye size={16} />
                                    View Document
                                  </Button>
                                ) : (
                                  <Button 
                                    disabled
                                    className="w-full bg-slate-50 text-slate-300 rounded-2xl h-12 font-bold text-xs border border-slate-100 cursor-not-allowed"
                                  >
                                    Document Missing
                                  </Button>
                                )}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
              )}

              {/* Row B: Horizontal Split between Guidance and Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-5 border-t border-slate-100">
                 {/* Instruction (Left 65%) */}
                 <div className="sm:col-span-8 p-10 bg-slate-50/80 border border-slate-100 rounded-[40px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-6 transition-transform">
                       <ShieldCheck size={140} className="text-slate-900" />
                    </div>
                    <div className="relative z-10 space-y-4">
                       <div className="flex items-center gap-2 text-primary mb-2">
                          <Info size={16} />
                          <span className="text-[11px] font-black uppercase tracking-widest">HC Admin Update</span>
                       </div>
                       <p className="text-lg font-bold text-slate-600 leading-relaxed italic">
                          "{selectedRedemption.status === "REQUESTED" 
                            ? "Permintaan Anda telah kami terima. Tim HC sedang memproses verifikasi dokumen identitas untuk memastikan keaslian data. Mohon tunggu informasi selanjutnya."
                            : selectedRedemption.status === "REVIEWED"
                            ? "Dokumen Anda telah diverifikasi oleh tim HC. Saat ini kami sedang menyiapkan item hadiah fisik Anda untuk proses serah terima."
                            : selectedRedemption.status === "ACCEPTED"
                            ? "Selamat! Penukaran Anda telah selesai dan dikonfirmasi. Silakan datang ke meja layanan HC untuk pengambilan hadiah fisik Anda."
                            : selectedRedemption.status === "REJECTED"
                            ? `Mohon maaf, klaim ditolak: ${selectedRedemption.rejectReason || "Dokumen tidak sesuai standar."}`
                            : "Status permintaan Anda telah diperbarui dalam sistem kami."
                          }"
                       </p>
                       <div className="flex items-center gap-3 mt-6">
                          <div className="h-1 w-10 bg-primary/20 rounded-full" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Personnel</span>
                       </div>
                    </div>
                 </div>

                 {/* Buttons (Right 35%) */}
                 <div className="sm:col-span-4 flex flex-col gap-4 justify-center">
                    {["REQUESTED", "REVIEWED"].includes(selectedRedemption.status) && (
                      <Button 
                        onClick={(e) => handleCancel(selectedRedemption.id, e)}
                        disabled={isUpdating}
                        variant="outline"
                        className="w-full h-16 rounded-[24px] border-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold text-xs uppercase tracking-widest transition-all"
                      >
                        {isUpdating ? <Loader2 className="animate-spin" /> : (
                           <span className="flex items-center gap-2">
                              <X size={18} strokeWidth={3} />
                              Cancel Journey
                           </span>
                        )}
                      </Button>
                    )}
                    <Button 
                      onClick={() => setSelectedRedemption(null)} 
                      className={cn(
                        "w-full h-16 rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95",
                        ["REQUESTED", "REVIEWED"].includes(selectedRedemption.status) ? "sm:w-full" : "w-full"
                      )}
                    >
                       Close Tracking
                    </Button>
                 </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[32px] gap-0 ring-0">
          <div className="p-5 bg-white border-b border-slate-100 flex flex-row items-center justify-between">
            <DialogTitle className="text-xs font-black flex items-center gap-2 uppercase tracking-[0.2em] text-slate-400">
              <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                 <Eye size={16} />
              </div>
              {previewDoc?.label} Preview
            </DialogTitle>
          </div>
          <div className="p-8 flex items-center justify-center min-h-[500px]">
            {previewDoc && (
              <img 
                src={getDocUrl(previewDoc.url)} 
                alt="Document Preview" 
                className="max-w-full max-h-[70vh] object-contain rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-white/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Preview+Not+Available';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
