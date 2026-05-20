import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FileUp, Users, ShoppingBag, Zap, ChevronRight, UserCheck } from "lucide-react";
import { RedemptionQueueTable } from "@/features/admin/redemption-queue-table";
import { AdminClock } from "@/features/admin/admin-clock";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bento-grid">
          {/* Active Period Banner */}
          <div className="bento-span-12 bento-card p-6 flex flex-col md:flex-row md:items-start justify-between animate-fade-up-in">
            <div>
              <h1 className="text-card-heading text-2xl mb-1 leading-none">HC Admin Dashboard</h1>
              <p className="text-sm text-[--color-text-secondary] leading-none">Active Earning Period: P2 (Jun 16 → Dec 15)</p>
            </div>
            <div className="mt-4 md:mt-0">
              <AdminClock />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="bento-span-12 md:bento-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-1">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <FileUp className="h-[14px] w-[14px] text-[--color-text-secondary]" />
              Uploads This Month
            </h3>
            <p className="text-metric-hero text-[--color-text-primary]">4</p>
          </div>

          <div className="bento-span-12 md:bento-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-2">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <ShoppingBag className="h-[14px] w-[14px] text-[--color-warning]" />
              Pending Redeem
            </h3>
            <p className="text-metric-hero text-[--color-warning]">12</p>
          </div>

          <div className="bento-span-12 md:bento-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-3">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <Users className="h-[14px] w-[14px] text-[--color-info]" />
              Active Partners
            </h3>
            <p className="text-metric-hero text-[--color-info]">248</p>
          </div>

          <div className="bento-span-12 md:bento-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-4">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <Zap className="h-[14px] w-[14px] text-[--color-accent]" />
              Tokens Issued
            </h3>
            <p className="text-metric-hero text-[--color-accent]">14.2k</p>
          </div>

          {/* Action Center */}
          <div className="bento-span-12 animate-fade-up-in stagger-5">
            <div className="bento-card p-8 flex flex-col bg-linear-to-br from-[--color-surface] to-[--color-bg-subtle]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-card-heading text-xl">Action Center</h3>
                  <p className="text-sm text-[--color-text-secondary] mt-1">Quick access to core administrative tasks</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  href="/admin/uploads"
                  className="group relative p-6 rounded-2xl border border-[--color-border-subtle] bg-[--color-surface-base] hover:bg-[--color-surface-elevated] hover:border-[--color-accent] hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-5 overflow-hidden"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[--color-accent-muted] flex items-center justify-center border border-[--color-border-accent] text-[--color-accent] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <FileUp size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[--color-text-primary] mb-2 group-hover:text-[--color-accent] transition-colors">Process Uploads</h4>
                    <p className="text-sm text-[--color-text-secondary] leading-relaxed">
                      Upload and process spreadsheets to issue loyalty tokens to employees.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[--color-accent] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Get Started <ChevronRight size={14} />
                  </div>
                </Link>
                
                <Link
                  href="/admin/adjustments"
                  className="group relative p-6 rounded-2xl border border-[--color-border-subtle] bg-[--color-surface-base] hover:bg-[--color-surface-elevated] hover:border-[--color-error] hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-5 overflow-hidden"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[--color-error]/10 flex items-center justify-center border border-[--color-error]/20 text-[--color-error] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[--color-text-primary] mb-2 group-hover:text-[--color-error] transition-colors">Token Adjustments</h4>
                    <p className="text-sm text-[--color-text-secondary] leading-relaxed">
                      Manually add or deduct tokens for specific employees or corrections.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[--color-error] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Open Tool <ChevronRight size={14} />
                  </div>
                </Link>

                <Link
                  href="/admin/mitra-validation"
                  className="group relative p-6 rounded-2xl border border-[--color-border-subtle] bg-[--color-surface-base] hover:bg-[--color-surface-elevated] hover:border-[--color-info] hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-5 overflow-hidden"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[--color-info]/10 flex items-center justify-center border border-[--color-info]/20 text-[--color-info] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[--color-text-primary] mb-2 group-hover:text-[--color-info] transition-colors">Status Validation</h4>
                    <p className="text-sm text-[--color-text-secondary] leading-relaxed">
                      Manage and validate active or resigned status for Mitra members.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[--color-info] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Manage Status <ChevronRight size={14} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Redemption Queue Table */}
          <div className="bento-span-12 bento-card p-6 animate-fade-up-in stagger-5 min-h-[300px]">
            <h3 className="text-card-heading mb-6">Redemption Queue</h3>
            <RedemptionQueueTable />
          </div>

        </div>
      </main>
    </div>
  );
}
