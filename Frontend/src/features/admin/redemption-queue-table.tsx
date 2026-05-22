"use client";

import React, { useState } from "react";
import { RedemptionStatusChip, RedemptionStatus } from "@/components/shared/status-badge";
import { ChevronLeft, ChevronRight, User, Calendar } from "lucide-react";
import { DocumentVerificationDrawer } from "./document-verification-drawer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type RedemptionRequest = {
  id: string;
  mitraName: string;
  division: string;
  rewardName: string;
  tokenCost: number;
  status: RedemptionStatus;
  submittedAt: string;
  // Extra fields for drawer
  userId?: string;
  userNpk?: string;
  userDocuments?: any[];
  rewardId?: string;
  tokensSpent?: number;
  isRepresented?: boolean;
  powerOfAttorneyUrl?: string | null;
};

export function RedemptionQueueTable({ initialRequests = [] }: { initialRequests?: RedemptionRequest[] }) {
  const data = initialRequests.slice(0, 4); // Show only top 4 as requested

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full">
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {data.length > 0 ? (
            data.map((req, index) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.005, backgroundColor: "var(--color-bg-subtle)" }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-transparent hover:border-[--color-border-subtle] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">
                        {req.mitraName}
                      </p>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 uppercase tracking-tighter">
                        {req.division}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Calendar size={12} />
                      <span>{formatDate(req.submittedAt)}</span>
                      <span className="mx-1">•</span>
                      <span className="font-medium">{req.rewardName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <RedemptionStatusChip status={req.status} />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No pending requests found
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
