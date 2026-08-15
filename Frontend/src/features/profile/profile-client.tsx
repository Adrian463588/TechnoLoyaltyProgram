"use client";

import { useState } from "react";
import { User, Mail, Shield, Lock, Fingerprint } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { ChangePasswordForm } from "./change-password-form";
import { cn } from "@/lib/utils";

type Tab = "general" | "security";

export function ProfileClient({ 
  user, 
  accessToken 
}: { 
  user: any; 
  accessToken: string 
}) {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  const menuItems = [
    { id: "general", label: "General Info", icon: User },
    { id: "security", label: "Security & Password", icon: Lock },
  ];

  const userStatus = user?.status || "ACTIVE"; // Default to ACTIVE if not provided
  const isStatusActive = userStatus.toUpperCase() === "ACTIVE";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Sidebar Nav */}
      <div className="lg:col-span-3 space-y-6">
        <BentoCard className="p-0 overflow-hidden shadow-lg shadow-slate-200/50 border-none bg-white h-[500px] min-h-[500px] flex flex-col">
          <div className="pt-8 px-8 pb-6 flex flex-col items-center justify-center text-center bg-white">
            {/* Profile Icon - Circular with white border */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner border-4 border-white ring-1 ring-slate-100">
                <User className="w-12 h-12 text-primary" />
              </div>
            </div>

            {/* Name - Bold */}
            <h2 className="text-lg font-bold text-foreground mb-3 px-2">
              {user?.name || "User Name"}
            </h2>

            {/* Role - Purple Container */}
            <div className="mb-3 w-full px-4">
              <div className="bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase py-1.5 px-3 rounded-lg inline-block border border-primary/20">
                {user?.role || "MITRA"}
              </div>
            </div>

            {/* Status - Rounded Container with blinking dot on the left */}
            <div className="w-full px-4">
              <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 py-1.5 px-4 rounded-full inline-flex">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isStatusActive ? "bg-emerald-500" : "bg-red-500"
                )} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {userStatus}
                </span>
              </div>
            </div>
          </div>
          
          {/* Horizontal Line */}
          <div className="h-px bg-slate-100 mx-6" />

          {/* Navigation Menu */}
          <div className="p-3 space-y-1 bg-white">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  activeTab === item.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                )}
              >
                <item.icon size={18} className={cn(
                  "transition-colors",
                  activeTab === item.id ? "text-white" : "text-muted-foreground group-hover:text-primary"
                )} />
                {item.label}
              </button>
            ))}
          </div>

          {/* System Info & Version Footer */}
          <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-100/50">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">
                <span>System Version</span>
                <span className="text-foreground/60 font-mono">v2.1.0-STABLE</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">
                <span>Environment</span>
                <span className="text-emerald-600 font-bold">PRODUCTION</span>
              </div>
              <div className="mt-3 text-[9px] text-muted-foreground/50 text-center font-medium">
                © 2026 TechnoLoyalty Program • Berijalan
              </div>
            </div>
          </div>
          </BentoCard>
      </div>

      {/* Right Content Area */}
      <div className="lg:col-span-9 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "general" && (
          <div className="space-y-6">
            <BentoCard className="p-8 shadow-sm border-[var(--color-border-subtle)] h-[500px] min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Personal Information</h3>
                  <p className="text-sm text-muted-foreground mt-1">Update and manage your personal details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                  <div className="flex items-center gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl group transition-all">
                    <User size={18} className="text-slate-400" />
                    <span className="text-sm font-semibold text-foreground">{user?.name || "—"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                  <div className="flex items-center gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl group transition-all">
                    <Mail size={18} className="text-slate-400" />
                    <span className="text-sm font-semibold text-foreground">{user?.email || "—"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">System Role</label>
                  <div className="flex items-center gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl group transition-all">
                    <Shield size={18} className="text-slate-400" />
                    <span className="text-sm font-semibold text-foreground">{(user as { role?: string })?.role || "MITRA"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Employee NPK</label>
                  <div className="flex items-center gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl group transition-all">
                    <Fingerprint size={18} className="text-slate-400" />
                    <span className="text-sm font-semibold text-foreground font-mono">{user?.npk || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3 items-start">
                   <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm shrink-0">
                      <Lock size={16} />
                   </div>
                   <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
                     Some personal information is synced with Human Capital systems and cannot be changed here. Contact HC support if you find any discrepancies.
                   </p>
                </div>
              </div>
            </BentoCard>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <BentoCard className="p-8 shadow-sm border-[var(--color-border-subtle)] h-[500px] min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Security Settings</h3>
                  <p className="text-sm text-muted-foreground mt-1">Protect your account with a strong password.</p>
                </div>
              </div>

              <ChangePasswordForm accessToken={accessToken} />
            </BentoCard>
          </div>
        )}
      </div>
    </div>
  );
}

