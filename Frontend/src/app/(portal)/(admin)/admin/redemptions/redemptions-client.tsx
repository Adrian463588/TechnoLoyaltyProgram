"use client";

import { useState } from "react";
import { RewardRequest, RewardRequestStatus } from "@/types";
import { adminApi } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AutosaveIndicator } from "@/components/shared/autosave-indicator";
import { PipelineStep } from "@/components/shared/redemption-pipeline";
import { CheckSquare, Info, ExternalLink, X, Loader2, FileText, Check, User, ShoppingBag, Coins, ShieldCheck, AlertCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";

const STATUS_TO_STEP: Record<RewardRequestStatus, PipelineStep> = {
  REQUESTED: "review",
  REVIEWED:  "review",
  ACCEPTED:  "accepted",
  REJECTED:  "submitted",
  CANCELLED: "submitted",
};

interface RedemptionsClientProps {
  initialRequests: (RewardRequest & { 
    userDocuments: Array<{ id: string, type: string, fileUrl: string }>;
    isRepresented?: boolean;
    powerOfAttorneyUrl?: string | null;
  })[];
  sessionToken: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function RedemptionsClient({
  initialRequests,
  sessionToken,
  totalCount,
  currentPage,
  totalPages,
}: RedemptionsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<"All" | RewardRequestStatus>("All");
  const [selectedRequest, setSelectedRequest] = useState<typeof initialRequests[0] | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; reqId: string | null }>({
    open: false,
    reqId: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ url: string, label: string } | null>(null);

  const filtered =
    filter === "All" ? requests : requests.filter((r) => r.status === filter);

  // Pagination logic for filtered results
  const displayTotalResults = filter === "All" ? totalCount : filtered.length;
  const displayTotalPages = filter === "All" ? totalPages : Math.ceil(filtered.length / 10);
  
  // Note: For a true fix in a large dataset, pagination should happen on the server.
  // This client-side adjustment handles the current local filtering scenario.

  const handleFilterChange = (newFilter: "All" | RewardRequestStatus) => {
    setFilter(newFilter);
    // Optionally: if this was client-side only pagination, we'd reset the page here.
    // However, since pagination is server-driven via URL, client-side filtering 
    // is limited to the current page's data.
  };

  const handleStatusUpdate = async (
    id: string,
    newStatus: RewardRequestStatus,
    reason?: string
  ) => {
    setIsUpdating(true);
    try {
      await adminApi.updateRedemptionStatus(sessionToken, id, newStatus, reason);
      
      const updated = requests.map((r) =>
        r.id === id ? { ...r, status: newStatus, rejectReason: reason } : r
      );
      setRequests(updated);
      
      if (selectedRequest?.id === id) {
        setSelectedRequest(updated.find(r => r.id === id) || null);
      }

      setSavedId(id);
      setTimeout(() => setSavedId(null), 1000);
      toast.success(`Request updated to ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed — please retry");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectSubmit = () => {
    if (rejectDialog.reqId && rejectReason.trim()) {
      handleStatusUpdate(rejectDialog.reqId, "REJECTED", rejectReason);
      setRejectDialog({ open: false, reqId: null });
      setRejectReason("");
    }
  };

  const getStatusBadge = (status: RewardRequestStatus) => {
    const base = "font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm flex items-center w-fit gap-1.5";
    switch (status) {
      case "REQUESTED":
        return (
          <span className={cn(base, "bg-orange-500/10 text-orange-600 border-orange-200")}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Requested
          </span>
        );
      case "REVIEWED":
        return (
          <span className={cn(base, "bg-blue-500/10 text-blue-600 border-blue-200")}>
            Reviewed
          </span>
        );
      case "ACCEPTED":
        return (
          <span className={cn(base, "bg-emerald-500/10 text-emerald-600 border-emerald-200")}>
            Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span className={cn(base, "bg-red-500/10 text-red-600 border-red-200")}>
            Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className={cn(base, "bg-neutral-500/10 text-neutral-600 border-neutral-200")}>
            Cancelled
          </span>
        );
      default:
        return <span className={cn(base, "bg-neutral-100 text-neutral-600")}>{status}</span>;
    }
  };

  const getDocUrl = (url: string) => {
    return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/${url}`;
  };

  return (
    <div className="space-y-6">
      <BentoCard className="p-0 overflow-hidden shadow-sm border-[var(--color-border-subtle)] animate-fade-up-in" style={{ animationDelay: "100ms" }}>
        <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Redemption List</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 p-1 bg-slate-100/50 rounded-lg border border-slate-200/50">
              {(["All", "REQUESTED", "REVIEWED", "REJECTED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                    filter === status 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {status === "All" ? "All" : 
                   status === "REQUESTED" ? "Request" : 
                   status === "REVIEWED" ? "Reviewed" : "Rejected"}
                </button>
              ))}
            </div>
            <Badge variant="outline" className="font-mono bg-white text-slate-500 border-slate-200">
              {filtered.length} Results
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <Table data-testid="redemptions-table" className="min-w-[900px]">
            <TableHeader className="bg-[var(--color-surface-elevated)]/50">
              <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                <TableHead className="w-[120px] py-4 px-6 font-semibold text-[var(--color-text-secondary)]">NPK</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Employee</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Reward</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-right">Cost</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Status</TableHead>
                <TableHead className="w-[100px] py-4 px-6 text-right font-semibold text-[var(--color-text-secondary)]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-40 text-center text-[var(--color-text-tertiary)]">
                    No requests match your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((req) => (
                  <TableRow
                    key={req.id}
                    className="group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05] cursor-default"
                  >
                    <TableCell className="py-4 px-6 text-xs text-[var(--color-text-secondary)]">
                      {req.userNpk}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)] transition-colors">
                      {req.userName}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)]">
                      {req.rewardName}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {req.tokensSpent.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        {savedId === req.id && <AutosaveIndicator show label="Updated" />}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="p-2.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-xl transition-all border border-transparent hover:border-[var(--color-accent)]/20 active:scale-95"
                        title="Track & Manage"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={displayTotalPages}
          totalResults={displayTotalResults}
        />
      </BentoCard>

      {/* Tracker & Management Modal — WIDE FLOW REDESIGN */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white border border-white/20 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            
            {/* 1. Header Row */}
            <div className="flex items-center justify-between p-8 border-b border-slate-100 flex-shrink-0 bg-white relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <CheckSquare size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Redemption Review Center</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-slate-900 text-white border-none rounded-lg px-2 py-0.5 text-[10px] font-mono">{selectedRequest.userNpk}</Badge>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{selectedRequest.userName}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "hidden sm:flex px-4 py-2 rounded-2xl border font-black text-[10px] uppercase tracking-widest items-center gap-2",
                  selectedRequest.isRepresented 
                    ? "bg-amber-50 text-amber-600 border-amber-100 shadow-sm" 
                    : "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm"
                )}>
                  <User size={14} />
                  {selectedRequest.isRepresented ? "Representative Pickup" : "Direct Pickup"}
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* 2. Journey Row (Horizontal Pipeline) */}
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex-shrink-0">
               <div className="max-w-3xl mx-auto w-full">
                  <div className="flex items-center justify-between relative px-2">
                    {[
                      { key: "submitted", label: "Request Sent", icon: Check },
                      { key: "review",    label: "Document Review", icon: Info },
                      { key: "accepted",  label: "Confirmation", icon: ShieldCheck }
                    ].map((step, idx) => {
                      let isDone = false;
                      let isActive = false;
                      
                      if (selectedRequest.status === "ACCEPTED") {
                        isDone = true;
                      } else if (selectedRequest.status === "REVIEWED") {
                        if (step.key === "submitted" || step.key === "review") isDone = true;
                        if (step.key === "accepted") isActive = true;
                      } else if (selectedRequest.status === "REQUESTED") {
                        if (step.key === "submitted") isDone = true;
                        if (step.key === "review") isActive = true;
                      } else {
                        // For REJECTED / CANCELLED
                        if (step.key === "submitted") isDone = true;
                      }

                      return (
                        <div key={step.key} className="flex flex-col items-center gap-3 relative z-10 flex-1">
                          {idx < 2 && (
                            <div className={cn(
                              "absolute left-[calc(50%+20px)] top-4 w-[calc(100%-40px)] h-0.5 rounded-full transition-colors duration-1000",
                              isDone ? "bg-primary" : "bg-slate-200"
                            )} />
                          )}
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                            isDone ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : 
                            isActive ? "bg-white border-primary text-primary shadow-xl scale-110" : 
                            "bg-white border-slate-200 text-slate-300"
                          )}>
                            {isDone ? <Check size={18} strokeWidth={4} /> : <step.icon size={18} />}
                          </div>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest text-center transition-colors",
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

            {/* 3. Main Content: Conditional Hub Rendering */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 hide-scrollbar">
              
              {/* Summary Strip (Always Visible) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                 <div className="sm:col-span-8 p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                         <ShoppingBag size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Reward</p>
                          <h4 className="text-base font-extrabold text-slate-900 leading-tight">{selectedRequest.rewardName}</h4>
                       </div>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-4 hidden sm:block" />
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Token Cost</p>
                       <div className="flex items-center justify-end gap-1.5 text-xl font-black text-primary font-mono">
                          {selectedRequest.tokensSpent.toLocaleString()}
                          <Coins size={16} />
                       </div>
                    </div>
                 </div>

                 {selectedRequest.status === "REJECTED" || selectedRequest.status === "CANCELLED" ? (
                   <div className="sm:col-span-4 p-5 bg-red-50/50 border border-red-100 rounded-3xl flex gap-3 items-center">
                     <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                     <div className="truncate">
                       <p className="text-[10px] font-black text-red-900 uppercase tracking-wider">
                         {selectedRequest.status === "REJECTED" ? "Rejection Reason" : "Cancellation Note"}
                       </p>
                       <p className="text-xs text-red-700 font-medium truncate">
                         {selectedRequest.rejectReason || "No details provided."}
                       </p>
                     </div>
                   </div>
                 ) : (
                   <div className="sm:col-span-4 p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex gap-3 items-center">
                     <Info className="w-5 h-5 text-blue-500 shrink-0" />
                     <div>
                       <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider">HC Instruction</p>
                       <p className="text-xs text-blue-700 font-medium">
                          {selectedRequest.status === "REQUESTED" ? "Review documents below." : 
                           selectedRequest.status === "REVIEWED" ? "Verify reward handover." : 
                           "Claim has been processed."}
                       </p>
                     </div>
                   </div>
                 )}
              </div>

              {/* PHASE 1: DOCUMENT REVIEW (REQUESTED) */}
              {selectedRequest.status === "REQUESTED" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center gap-3">
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Identity Hub (Step 2)</h3>
                     <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                     {[
                       { label: "National ID (KTP)", type: "KTP", icon: FileText, color: "blue" },
                       { label: "Partner ID Card", type: "ID_CARD_MITRA", icon: ShieldCheck, color: "indigo" },
                       { label: "Tax Card (NPWP)", type: "NPWP", icon: Coins, color: "slate" },
                     ].map(doc => {
                       const userDoc = selectedRequest.userDocuments.find(d => d.type === doc.type);
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
                               {userDoc ? (
                                 <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                   <Check size={12} strokeWidth={4} />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Available</span>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100">
                                   <X size={12} strokeWidth={4} />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Missing</span>
                                 </div>
                               )}
                            </div>
                            <p className="text-sm font-black text-slate-900 mb-1">{doc.label}</p>
                            <p className="text-[10px] text-slate-500 font-medium mb-8 leading-relaxed">Required identity document for this mitra.</p>
                            
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
                                  Document Pending
                                </Button>
                              )}
                            </div>
                         </div>
                       );
                     })}

                     {/* Power of Attorney Card */}
                     {selectedRequest.isRepresented && (
                       <div className="sm:col-span-2 lg:col-span-3 p-8 rounded-[32px] border-2 border-dashed border-amber-200 bg-amber-50/20 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-amber-400 transition-all duration-300 shadow-inner">
                          <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
                             <div className="h-20 w-20 rounded-[24px] bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                               <FileText size={40} />
                             </div>
                             <div className="space-y-1">
                                <p className="text-xl font-black text-amber-900 leading-tight">Surat Kuasa (Power of Attorney)</p>
                                <p className="text-sm text-amber-700/60 font-bold">Mandatory for pick-up by a representative person.</p>
                             </div>
                          </div>
                          {selectedRequest.powerOfAttorneyUrl ? (
                            <Button 
                              className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl px-10 h-14 font-black text-sm gap-3 shadow-xl shadow-amber-200/50 transition-all hover:scale-105 active:scale-95"
                              onClick={() => setPreviewDoc({ url: selectedRequest.powerOfAttorneyUrl!, label: "Surat Kuasa" })}
                            >
                              <Eye size={20} />
                              Verify POA File
                            </Button>
                          ) : (
                            <div className="px-8 py-4 rounded-2xl bg-red-100 text-red-700 text-xs font-black uppercase tracking-[0.2em] border border-red-200 flex items-center gap-3">
                               <AlertCircle size={18} strokeWidth={3} />
                               File is Missing
                            </div>
                          )}
                       </div>
                     )}
                  </div>
                </div>
              )}

              {/* PHASE 2: CONFIRMATION (REVIEWED) */}
              {selectedRequest.status === "REVIEWED" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center gap-3">
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Fulfillment Hub (Step 3)</h3>
                     <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                      { label: "Reward Handover", desc: `Physical item "${selectedRequest.rewardName}" ready.`, icon: ShoppingBag, color: "emerald" },
                      { label: "Identity Check", desc: "User identity verified via physical documents.", icon: User, color: "blue" },
                      { label: "System Sync", desc: "Ledger and inventory will be updated automatically.", icon: ShieldCheck, color: "indigo" },
                    ].map((card, i) => (
                      <div key={i} className="group relative p-6 rounded-[28px] border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 flex flex-col h-full">
                         <div className="flex items-start justify-between mb-4">
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors group-hover:bg-emerald-500 group-hover:text-white", 
                              card.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                              card.color === "blue" ? "bg-blue-50 text-blue-600" :
                              "bg-indigo-50 text-indigo-600"
                            )}>
                               <card.icon size={24} />
                            </div>
                            <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                               <Check size={14} strokeWidth={4} />
                            </div>
                         </div>
                         <p className="text-sm font-black text-slate-900 mb-1">{card.label}</p>
                         <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Wide Info Card for Reviewed Phase */}
                  <div className="p-8 rounded-[32px] bg-indigo-50/50 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                         <ShieldCheck size={32} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-lg font-black leading-tight text-indigo-900">Ready for Final Confirmation</p>
                          <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">Verification Phase Complete</p>
                       </div>
                    </div>
                    <div className="px-6 py-3 bg-white rounded-2xl border border-indigo-100 text-xs font-bold text-indigo-700 max-w-xs italic text-center md:text-left shadow-sm">
                       &quot;Admin has verified the documentation. Proceed to finalize the reward handover.&quot;
                    </div>
                  </div>
                </div>
              )}

              {/* SUCCESS STATE (ACCEPTED) */}
              {selectedRequest.status === "ACCEPTED" && (
                <div className="flex flex-col items-center justify-center py-16 space-y-5 animate-in zoom-in-95 duration-700">
                   <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-200 ring-[8px] ring-emerald-50">
                     <Check size={48} strokeWidth={4} />
                   </div>
                   <div className="text-center space-y-1">
                      <p className="text-xl font-black text-slate-900 tracking-tight">Klaim Berhasil</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Redemption Completed & Logged</p>
                   </div>
                   <Button 
                    onClick={() => setSelectedRequest(null)}
                    className="px-8 h-12 bg-slate-900 text-white rounded-xl font-black text-xs transition-all hover:bg-slate-800"
                   >
                     Close Review Center
                   </Button>
                </div>
              )}

              {/* REJECTED / CANCELLED STATES */}
              {["REJECTED", "CANCELLED"].includes(selectedRequest.status) && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-40 grayscale scale-90 animate-in fade-in duration-500">
                   <div className="h-24 w-24 rounded-full border-4 border-slate-300 flex items-center justify-center text-slate-400">
                      <X size={48} strokeWidth={3} />
                   </div>
                   <p className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Application Closed</p>
                   {selectedRequest.rejectReason && (
                     <p className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl italic">&quot;{selectedRequest.rejectReason}&quot;</p>
                   )}
                </div>
              )}

              {/* Final Decision Area (Visible for REQUESTED and REVIEWED) */}
              {(selectedRequest.status === "REQUESTED" || selectedRequest.status === "REVIEWED") && (
                <div className="pt-10 border-t border-slate-100">
                   <div className="flex flex-col items-center gap-8">
                      {selectedRequest.status === "REQUESTED" && (
                        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                          <Button
                            onClick={() => handleStatusUpdate(selectedRequest.id, "REVIEWED")}
                            className="w-full sm:w-[320px] h-16 bg-primary hover:bg-primary/90 text-white rounded-[24px] font-black text-base shadow-[0_24px_48px_-12px_rgba(var(--color-primary-rgb),0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isUpdating}
                          >
                            {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                              <span className="flex items-center gap-3">
                                <Check size={24} strokeWidth={3} />
                                Konfirmasi
                              </span>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setRejectDialog({ open: true, reqId: selectedRequest.id })}
                            className="w-full sm:w-[200px] h-16 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-[24px] font-bold text-sm transition-all"
                            disabled={isUpdating}
                          >
                            Reject Application
                          </Button>
                        </div>
                      )}

                      {selectedRequest.status === "REVIEWED" && (
                        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                          <Button
                            onClick={() => handleStatusUpdate(selectedRequest.id, "ACCEPTED")}
                            className="w-full sm:w-[320px] h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black text-base shadow-[0_24px_48px_-12px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isUpdating}
                          >
                            {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                              <span className="flex items-center gap-3">
                                <ShieldCheck size={24} />
                                Konfirmasi Klaim
                              </span>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setRejectDialog({ open: true, reqId: selectedRequest.id })}
                            className="w-full sm:w-[200px] h-16 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-[24px] font-bold text-sm transition-all"
                            disabled={isUpdating}
                          >
                            Reject Application
                          </Button>
                        </div>
                      )}
                   </div>
                </div>
              )}
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

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="rounded-[32px] border-none shadow-2xl overflow-hidden p-0 max-w-sm gap-0 ring-0">
          <div className="p-8 text-center bg-red-50 border-b border-red-100">
             <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-red-600 mx-auto shadow-sm border border-red-100 mb-4">
                <AlertCircle size={32} />
             </div>
             <DialogTitle className="text-xl font-black text-red-900 tracking-tight">Reject Application?</DialogTitle>
             <DialogDescription className="text-red-700/70 font-bold text-[11px] uppercase tracking-widest mt-1">
               Identity validation failed
             </DialogDescription>
          </div>
          <div className="p-8 space-y-6 bg-white">
            <Textarea
              placeholder="Contoh: Dokumen KTP tidak terbaca (blur). Mohon unggah ulang dengan foto yang lebih jelas."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[140px] rounded-[20px] bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary text-sm font-medium p-4 resize-none"
              data-testid="reject-reason-input"
            />
            <div className="flex gap-3">
               <Button
                variant="outline"
                onClick={() => setRejectDialog({ open: false, reqId: null })}
                className="flex-1 rounded-2xl h-14 font-bold text-slate-500 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || isUpdating}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 font-black shadow-lg shadow-red-200/50"
                data-testid="confirm-reject-btn"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
