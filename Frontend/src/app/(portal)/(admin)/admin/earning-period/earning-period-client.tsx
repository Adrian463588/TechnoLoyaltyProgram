"use client";

import React, { useState } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi, SystemSettingsResponse } from "@/lib/api-client";
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Save, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface EarningPeriodClientProps {
  initialSettings: SystemSettingsResponse | null;
  sessionToken: string;
}

const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

// Helper to get days in month
const getDays = (month: string) => {
  const m = parseInt(month);
  let count = 31;
  if ([4, 6, 9, 11].includes(m)) count = 30;
  if (m === 2) count = 29; // Include leap year day to be safe
  
  return Array.from({ length: count }, (_, i) => {
    const day = i + 1;
    return { label: day.toString(), value: day.toString().padStart(2, "0") };
  });
};

export function EarningPeriodClient({ initialSettings, sessionToken }: EarningPeriodClientProps) {
  const [isSaving, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [settings, setSettings] = useState<Partial<SystemSettingsResponse>>(initialSettings || {
    p1Start: "06-16",
    p1End: "12-15",
    p2Start: "12-16",
    p2End: "06-15",
    claimP1Start: "01-01",
    claimP1End: "01-31",
    claimP2Start: "07-01",
    claimP2End: "07-31",
    rewardPickupLocation: "HC Office - Main Building",
  });

  const parseDate = (val: string) => {
    const [m, d] = (val || "01-01").split("-");
    return { month: m, day: d };
  };

  const handleDateChange = (field: keyof SystemSettingsResponse, type: 'month' | 'day', val: string) => {
    const current = parseDate(settings[field] as string);
    if (type === 'month') current.month = val;
    else current.day = val;
    
    setSettings(prev => ({
      ...prev,
      [field]: `${current.month}-${current.day}`
    }));
  };

  const onSave = async () => {
    setShowConfirm(false);
    setIsUpdating(true);
    try {
      const { id, updatedAt, ...payload } = settings as any;
      await adminApi.updateSystemSettings(sessionToken, payload);
      toast.success("Settings updated successfully. These will recur annually.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const DateSelector = ({ label, field, icon: Icon }: { label: string, field: keyof SystemSettingsResponse, icon: any }) => {
    const { month, day } = parseDate(settings[field] as string);
    return (
      <div className="space-y-3">
        <Label className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] flex items-center gap-2">
          <Icon className="w-3 h-3" />
          {label}
        </Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={month} onValueChange={(val) => handleDateChange(field, 'month', val)}>
              <SelectTrigger className="h-11 w-full bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] rounded-xl">
                <SelectValue placeholder="Month">
                  {MONTHS.find(m => m.value === month)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[84px]">
            <Select value={day} onValueChange={(val) => handleDateChange(field, 'day', val)}>
              <SelectTrigger className="h-11 w-full bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] rounded-xl">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {getDays(month).map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Unified System Configuration Card */}
      <div className="bento-span-12">
        <BentoCard className="p-0 overflow-hidden border-[var(--color-border-subtle)] shadow-sm animate-fade-up-in" style={{ animationDelay: "50ms" }}>
          <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">System Cycles & Logistics</h2>
            </div>
          </div>

          <div className="p-8 space-y-12">
            {/* 1. PERIOD ONE (P1) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] border-l-4 border-slate-900 pl-3">
                EARNING PERIOD ONE (P1)
              </h3>
              <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-[24px] bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)]">
                <div className="flex-1 w-full">
                  <DateSelector label="Starts On" field="p1Start" icon={Clock} />
                </div>
                <div className="hidden sm:block mt-[34px]">
                  <ArrowRight className="text-slate-300 w-5 h-5" />
                </div>
                <div className="flex-1 w-full">
                  <DateSelector label="Ends On" field="p1End" icon={Clock} />
                </div>
              </div>
            </div>

            {/* 2. PERIOD TWO (P2) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] border-l-4 border-primary pl-3">
                EARNING PERIOD TWO (P2)
              </h3>
              <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-[24px] bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)]">
                <div className="flex-1 w-full">
                  <DateSelector label="Starts On" field="p2Start" icon={Clock} />
                </div>
                <div className="hidden sm:block mt-[34px]">
                  <ArrowRight className="text-slate-300 w-5 h-5" />
                </div>
                <div className="flex-1 w-full">
                  <DateSelector label="Ends On" field="p2End" icon={Clock} />
                </div>
              </div>
            </div>

            {/* 3. CLAIM PERIOD P1 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] border-l-4 border-emerald-500 pl-3">
                CLAIM PERIOD ONE (P1)
              </h3>
              <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-[24px] bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)]">
                <div className="flex-1 w-full">
                  <DateSelector label="Claims Start" field="claimP1Start" icon={Sparkles} />
                </div>
                <div className="hidden sm:block mt-[34px]">
                  <ArrowRight className="text-slate-300 w-5 h-5" />
                </div>
                <div className="flex-1 w-full">
                  <DateSelector label="Claims End" field="claimP1End" icon={Sparkles} />
                </div>
              </div>
            </div>

            {/* 4. CLAIM PERIOD P2 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] border-l-4 border-emerald-600 pl-3">
                CLAIM PERIOD TWO (P2)
              </h3>
              <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-[24px] bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)]">
                <div className="flex-1 w-full">
                  <DateSelector label="Claims Start" field="claimP2Start" icon={Sparkles} />
                </div>
                <div className="hidden sm:block mt-[34px]">
                  <ArrowRight className="text-slate-300 w-5 h-5" />
                </div>
                <div className="flex-1 w-full">
                  <DateSelector label="Claims End" field="claimP2End" icon={Sparkles} />
                </div>
              </div>
            </div>

            {/* 5. COLLECTION POINT */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] border-l-4 border-indigo-500 pl-3">
                COLLECTION POINT
              </h3>
              <div className="p-6 rounded-[24px] bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)]">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Pickup Location Name
                  </Label>
                  <Input 
                    value={settings.rewardPickupLocation}
                    onChange={(e) => setSettings(prev => ({ ...prev, rewardPickupLocation: e.target.value }))}
                    placeholder="e.g. HC Office - Main Lobby"
                    className="h-11 rounded-xl bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] text-sm focus:border-primary transition-all max-w-2xl"
                  />
                  <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed pl-1">
                    This location will be displayed to employees upon successful reward redemption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Save Action - Unified White Theme */}
      <div className="bento-span-12 animate-fade-up-in" style={{ animationDelay: "200ms" }}>
        <BentoCard className="flex flex-col sm:flex-row items-center justify-between gap-8 p-8 bg-[var(--color-surface-elevated)]/40 rounded-[32px] border-[var(--color-border-subtle)] shadow-sm">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 tracking-tight text-base">Global Configuration</p>
              <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
                Changes will persist annually. Ensure all dates and logistics align with the latest company loyalty policy before committing updates.
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowConfirm(true)}
            disabled={isSaving}
            className="w-full sm:w-auto h-14 px-10 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm transition-all active:scale-95 shadow-xl shadow-primary/30 flex items-center gap-3"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </Button>
        </BentoCard>
      </div>

      {/* Stylized Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl max-w-md p-0 overflow-hidden">
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner animate-pulse">
              <CheckCircle2 size={32} />
            </div>
            
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-center">
                Commit System Changes?
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm leading-relaxed text-center px-2">
                You are about to update the global loyalty cycles. This action will affect reward eligibility and redemption dates for all employees across the organization.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Updates
              </Button>
            </div>
          </div>
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </DialogContent>
      </Dialog>
    </>
  );
}
