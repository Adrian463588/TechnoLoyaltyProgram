"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Check, Shield, FileText, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { RedemptionStatusChip } from "@/components/shared/status-badge";
import { motion } from "framer-motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DocumentVerificationDrawer({ request, onClose }: { request: any; onClose: () => void }) {
  const [docs, setDocs] = useState({ idCard: false, ktp: false, npwp: false, poa: false });
  const [isVisible, setIsVisible] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  // Capture the element that opened the drawer so focus returns on close
  const returnFocusRef = useRef<Element | null>(null);

  const isAllVerified = docs.idCard && docs.ktp && docs.npwp;

  const handleClose = () => {
    setIsVisible(false);
    // Return focus to the element that triggered the drawer
    setTimeout(() => {
      (returnFocusRef.current as HTMLElement | null)?.focus();
      onClose();
    }, 300);
  };

  useEffect(() => {
    // Save current focused element to restore on close
    returnFocusRef.current = document.activeElement;
    // Lock body scroll
    document.body.style.overflow = "hidden";
    // Defer so CSS transition plays
    const raf = requestAnimationFrame(() => setIsVisible(true));

    // Escape key handler
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handleApprove = async () => {
    setIsApproving(true);
    await new Promise(res => setTimeout(res, 600));
    toast.success("Redemption verified and approved!");
    handleClose();
  };

  const checkedCount = [docs.idCard, docs.ktp, docs.npwp].filter(Boolean).length;

  const docItems = [
    { key: "idCard" as const, label: "Partner ID Card", testId: "doc-checkbox-idcard", icon: CreditCard },
    { key: "ktp" as const, label: "KTP (National ID)", testId: "doc-checkbox-ktp", icon: FileText },
    { key: "npwp" as const, label: "NPWP (Tax ID)", testId: "doc-checkbox-npwp", icon: FileText },
    { key: "poa" as const, label: "Power of Attorney (Optional)", testId: "doc-checkbox-poa", icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" data-testid="verify-redemption-drawer">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-md h-full bg-white shadow-xl border border-border rounded-xl border-l border-[--color-border-glass] p-6 flex flex-col overflow-y-auto"
        style={{
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.34, 1.10, 0.64, 1)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Verify Redemption"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[--color-accent-muted] flex items-center justify-center">
              <Shield className="h-4 w-4 text-[--color-accent]" />
            </div>
            <h2
              className="text-xl font-display font-semibold text-[--color-text-primary]"
              data-testid="verify-redemption-heading"
            >
              Verify Redemption
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-[--color-text-secondary] hover:text-[--color-text-primary]"
            aria-label="Close drawer"
            data-testid="close-drawer-btn"
          >
            <X size={18} />
          </motion.button>
        </div>

        {/* Request Info */}
        <div className="mb-6 space-y-2 p-4 rounded-xl bg-white/5 border border-[--color-border-glass]">
          <div className="flex justify-between text-sm">
            <span className="text-[--color-text-secondary]">Request ID:</span>
            <span className="font-mono text-[--color-text-primary]">{request.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[--color-text-secondary]">Mitra Name:</span>
            <span className="text-[--color-text-primary] font-medium">{request.mitraName}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[--color-text-secondary]">Status:</span>
            <RedemptionStatusChip status={request.status} />
          </div>
        </div>

        {/* Checklist */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 border-b border-[--color-border-subtle] pb-3 mb-4">
            <FileText className="h-4 w-4 text-[--color-text-secondary]" />
            <h3 className="text-card-heading">Document Checklist</h3>
          </div>

          {docItems.map(({ key, label, testId, icon: Icon }) => (
            <label
              key={key}
              className="flex items-center gap-4 p-3 rounded-xl cursor-pointer border transition-all duration-200"
              style={{
                background: docs[key] ? "rgba(107,206,83,0.08)" : "rgba(255,255,255,0.04)",
                borderColor: docs[key] ? "rgba(107,206,83,0.4)" : "rgba(255,255,255,0.08)",
              }}
            >
              <input
                type="checkbox"
                checked={docs[key]}
                onChange={e => setDocs(d => ({ ...d, [key]: e.target.checked }))}
                data-testid={testId}
                className="sr-only"
              />
              {/* Custom checkbox visual */}
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: docs[key] ? "var(--color-accent)" : "transparent",
                  borderColor: docs[key] ? "var(--color-accent)" : "rgba(255,255,255,0.3)",
                }}
              >
                {docs[key] && <Check size={11} className="text-[--color-bg-base]" strokeWidth={3} />}
              </div>
              <Icon className={`h-4 w-4 flex-shrink-0 ${docs[key] ? "text-[--color-accent]" : "text-[--color-text-secondary]"}`} />
              <span className={`text-sm ${docs[key] ? "text-[--color-text-primary] font-medium" : "text-[--color-text-secondary]"}`}>
                {label}
              </span>
            </label>
          ))}

          {/* Progress bar */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-[--color-accent] transition-all duration-500"
                style={{ width: `${(checkedCount / 3) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[--color-text-secondary]">{checkedCount}/3 required</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[--color-border-subtle] mt-6 space-y-3">
          {!isAllVerified && (
            <p className="text-xs text-center text-[--color-text-secondary]">
              Complete all required documents to approve
            </p>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleApprove}
            disabled={!isAllVerified || isApproving}
            className="btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="approve-redemption-btn"
          >
            {isApproving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-[--color-bg-base]/60 border-t-[--color-bg-base] animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check size={16} />
                Approve Redemption
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
