"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { confirmPartnerStatus } from "@/features/leader/actions";
import type { PartnerConfirmationResponse } from "@/lib/api-client";

interface Props {
  confirmations: PartnerConfirmationResponse[];
}

/**
 * LeaderAlertsClient — TL-01
 *
 * Displays pending partner status confirmations requested by HC.
 * Leader can confirm Active or Resigned status for each mitra.
 */
export function LeaderAlertsClient({ confirmations }: Props) {
  const [items, setItems] = useState(confirmations);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pending  = items.filter((c) => c.status === "PENDING");
  const resolved = items.filter((c) => c.status !== "PENDING");

  function handleConfirm(
    id: string,
    decision: "ACTIVE" | "RESIGNED",
    note?: string,
  ) {
    setProcessingId(id);
    startTransition(async () => {
      const result = await confirmPartnerStatus(id, decision, note);
      if (result.success) {
        setItems((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: decision === "ACTIVE" ? "CONFIRMED_ACTIVE" : "CONFIRMED_RESIGNED",
                  confirmedStatus: decision,
                }
              : c,
          ),
        );
        toast.success(
          `Status confirmed: ${decision === "ACTIVE" ? "Active ✓" : "Resigned ✗"} for mitra`,
        );
      } else {
        toast.error(result.error ?? "Failed to confirm status");
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Team Alerts
            </h1>
            {pending.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-1 text-xs font-bold text-destructive animate-pulse">
                <Bell className="h-3 w-3" />
                {pending.length} pending
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Partner status confirmation requests from HC. Your response is required for each mitra.
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <BentoCard className="p-4 flex flex-col gap-1 border-l-4 border-l-destructive border-destructive/30">
          <p className="text-xs text-muted-foreground">Pending Confirmation</p>
          <p className="text-3xl font-bold text-destructive tabular-nums">{pending.length}</p>
          <div className="flex items-center gap-1 text-xs text-destructive/70">
            <AlertTriangle className="h-3 w-3" />
            Awaiting your response
          </div>
        </BentoCard>
        <BentoCard className="p-4 flex flex-col gap-1 border-l-4 border-l-primary border-primary/30">
          <p className="text-xs text-muted-foreground">Confirmed Active</p>
          <p className="text-3xl font-bold text-primary tabular-nums">
            {items.filter((c) => c.status === "CONFIRMED_ACTIVE").length}
          </p>
          <div className="flex items-center gap-1 text-xs text-primary/70">
            <CheckCircle2 className="h-3 w-3" />
            This period
          </div>
        </BentoCard>
        <BentoCard className="p-4 flex flex-col gap-1 border-l-4 border-l-muted-foreground border-muted/30">
          <p className="text-xs text-muted-foreground">Confirmed Resigned</p>
          <p className="text-3xl font-bold text-muted-foreground tabular-nums">
            {items.filter((c) => c.status === "CONFIRMED_RESIGNED").length}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <UserX className="h-3 w-3" />
            This period
          </div>
        </BentoCard>
      </div>

      {/* Pending confirmations */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pending Confirmation
          </h2>
          <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-foreground font-bold">
            {pending.length}
          </span>
        </div>

        {pending.length === 0 ? (
          <BentoCard className="p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">All Clear!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No pending partner confirmations for your team.
            </p>
          </BentoCard>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {pending.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className={cn(
                    "group relative rounded-2xl border border-l-4 border-l-yellow-500/70 p-5",
                    "bg-yellow-950/10 border-yellow-600/25",
                    "transition-shadow hover:shadow-lg hover:shadow-yellow-900/10",
                  )}
                  data-testid="leader-confirmation-row"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-950/40 border border-yellow-700/30 text-yellow-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {c.mitraName}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                          {c.mitraId}
                        </span>
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium bg-yellow-950/30 text-yellow-400 border-yellow-700/40">
                          HC Request
                        </span>
                      </div>
                      {c.reason && (
                        <p className="text-sm text-muted-foreground">{c.reason}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Requested{" "}
                        {new Date(c.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 sm:flex-col">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5 whitespace-nowrap"
                          disabled={isPending && processingId === c.id}
                          onClick={() => handleConfirm(c.id, "ACTIVE")}
                          data-testid="leader-confirm-active-btn"
                          aria-label={`Confirm ${c.mitraName} as Active`}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Active
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5 whitespace-nowrap"
                          disabled={isPending && processingId === c.id}
                          onClick={() => handleConfirm(c.id, "RESIGNED")}
                          data-testid="leader-confirm-resigned-btn"
                          aria-label={`Confirm ${c.mitraName} as Resigned`}
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Resigned
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Resolved confirmations */}
      {resolved.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Resolved
            </h2>
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-foreground font-bold">
              {resolved.length}
            </span>
          </div>
          <div className="space-y-2">
            {resolved.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-muted/10 p-4 flex items-center gap-4 opacity-50 hover:opacity-70 transition-opacity"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/30">
                  {c.confirmedStatus === "RESIGNED" ? (
                    <UserX className="h-4 w-4 text-destructive/60" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-primary/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-muted-foreground line-through">
                      {c.mitraName}
                    </span>
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium border-border text-muted-foreground bg-muted/40">
                      {c.confirmedStatus ?? c.status.replace("_", " ")}
                    </span>
                  </div>
                  {c.note && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-through">{c.note}</p>
                  )}
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary/60 shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
