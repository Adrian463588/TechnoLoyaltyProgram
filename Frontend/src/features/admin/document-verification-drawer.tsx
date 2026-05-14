"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { RedemptionStatusChip } from "@/components/shared/status-badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DocumentVerificationDrawer({ request, onClose }: { request: any; onClose: () => void }) {
  const [docs, setDocs] = useState({ idCard: false, ktp: false, npwp: false, poa: false });

  const isAllVerified = docs.idCard && docs.ktp && docs.npwp;

  const handleApprove = () => {
    toast.success("Redemption verified and approved!");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md h-full glass-elevated border-l border-t-0 border-b-0 border-r-0 rounded-none p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-display font-semibold text-[--color-text-primary]">Verify Redemption</h2>
            <button onClick={onClose} className="text-[--color-text-secondary] hover:text-[--color-text-primary]">
              <X size={20} />
            </button>
          </div>

          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[--color-text-secondary]">Request ID:</span>
              <span className="font-mono text-[--color-text-primary]">{request.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[--color-text-secondary]">Mitra Name:</span>
              <span className="text-[--color-text-primary]">{request.mitraName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[--color-text-secondary]">Status:</span>
              <RedemptionStatusChip status={request.status} />
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <h3 className="text-card-heading text-lg border-b border-[--color-border-subtle] pb-2">Document Checklist</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={docs.idCard}
                  onChange={e => setDocs(d => ({ ...d, idCard: e.target.checked }))}
                  className="w-5 h-5 rounded border-[--color-border-glass] bg-white/5 accent-[--color-accent] focus:ring-[--color-accent]"
                />
                <span className={docs.idCard ? "text-[--color-text-primary]" : "text-[--color-text-secondary]"}>Partner ID Card</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={docs.ktp}
                  onChange={e => setDocs(d => ({ ...d, ktp: e.target.checked }))}
                  className="w-5 h-5 rounded border-[--color-border-glass] bg-white/5 accent-[--color-accent] focus:ring-[--color-accent]"
                />
                <span className={docs.ktp ? "text-[--color-text-primary]" : "text-[--color-text-secondary]"}>KTP (National ID)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={docs.npwp}
                  onChange={e => setDocs(d => ({ ...d, npwp: e.target.checked }))}
                  className="w-5 h-5 rounded border-[--color-border-glass] bg-white/5 accent-[--color-accent] focus:ring-[--color-accent]"
                />
                <span className={docs.npwp ? "text-[--color-text-primary]" : "text-[--color-text-secondary]"}>NPWP (Tax ID)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={docs.poa}
                  onChange={e => setDocs(d => ({ ...d, poa: e.target.checked }))}
                  className="w-5 h-5 rounded border-[--color-border-glass] bg-white/5 accent-[--color-accent] focus:ring-[--color-accent]"
                />
                <span className={docs.poa ? "text-[--color-text-primary]" : "text-[--color-text-secondary]"}>Power of Attorney (Optional)</span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-[--color-border-subtle] mt-auto">
            <button 
              onClick={handleApprove}
              disabled={!isAllVerified}
              className="btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              Approve Redemption
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
