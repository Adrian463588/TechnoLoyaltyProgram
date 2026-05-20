import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Upload, Users, ShoppingBag, Coins, ChevronRight, UserCheck } from "lucide-react";
import { RedemptionQueueTable } from "@/features/admin/redemption-queue-table";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bento-grid">
          {/* Active Period Banner */}
          <div className="bento-span-12 bento-card p-6 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div>
              <h1 className="text-card-heading text-2xl mb-1">HC Admin Dashboard</h1>
              <p className="text-[--color-text-secondary]">Active Earning Period: P2 (Jun 16 → Dec 15)</p>
            </div>
            <div className="mt-4 md:mt-0 px-4 py-2 bg-[--color-accent-muted] text-[--color-accent] rounded-full text-sm font-semibold border border-[--color-border-accent]">
              System Status: Nominal
            </div>
          </div>

          {/* KPI Cards */}
          <div className="bento-span-12 md:bento-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-1">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <Upload className="h-[14px] w-[14px] text-[--color-text-secondary]" />
              Uploads This Month
            </h3>
            <p className="text-metric-hero text-[--color-text-primary]">4</p>
          </div>

          <div className="bento-span-12 md:bento-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-2" data-interactive="true">
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
              <Coins className="h-[14px] w-[14px] text-[--color-accent]" />
              Tokens Issued
            </h3>
            <p className="text-metric-hero text-[--color-accent]">14.2k</p>
          </div>

          {/* Action Center */}
          <div className="bento-span-12 lg:bento-span-8 flex flex-col gap-6 animate-fade-up-in stagger-5">
            <div className="bento-card p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-card-heading">Action Center</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
                <Link
                  href="/admin/uploads"
                  className="group relative p-5 rounded-2xl border border-[--color-border-subtle] bg-[--color-surface-base] hover:bg-[--color-surface-elevated] hover:border-[--color-accent] transition-all flex flex-col items-start gap-4 overflow-hidden"
                >
                  <div className="h-10 w-10 rounded-xl bg-[--color-accent-muted] flex items-center justify-center border border-[--color-border-accent] text-[--color-accent] group-hover:scale-110 transition-transform">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[--color-text-primary] mb-1">Process Uploads</h4>
                    <p className="text-xs text-[--color-text-secondary] leading-relaxed">
                      Upload spreadsheets to issue tokens.
                    </p>
                  </div>
                  <ChevronRight size={18} className="absolute right-5 bottom-5 text-[--color-text-tertiary] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
                
                <Link
                  href="/admin/adjustments"
                  className="group relative p-5 rounded-2xl border border-[--color-border-subtle] bg-[--color-surface-base] hover:bg-[--color-surface-elevated] hover:border-[--color-error] transition-all flex flex-col items-start gap-4 overflow-hidden"
                >
                  <div className="h-10 w-10 rounded-xl bg-[--color-error]/10 flex items-center justify-center border border-[--color-error]/20 text-[--color-error] group-hover:scale-110 transition-transform">
                    <Coins size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[--color-text-primary] mb-1">Token Adjustments</h4>
                    <p className="text-xs text-[--color-text-secondary] leading-relaxed">
                      Manually add or deduct tokens.
                    </p>
                  </div>
                  <ChevronRight size={18} className="absolute right-5 bottom-5 text-[--color-text-tertiary] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>

                <Link
                  href="/admin/mitra-validation"
                  className="group relative p-5 rounded-2xl border border-[--color-border-subtle] bg-[--color-surface-base] hover:bg-[--color-surface-elevated] hover:border-[--color-info] transition-all flex flex-col items-start gap-4 overflow-hidden"
                >
                  <div className="h-10 w-10 rounded-xl bg-[--color-info]/10 flex items-center justify-center border border-[--color-info]/20 text-[--color-info] group-hover:scale-110 transition-transform">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[--color-text-primary] mb-1">Status Validation</h4>
                    <p className="text-xs text-[--color-text-secondary] leading-relaxed">
                      Toggle Mitra active or resigned status.
                    </p>
                  </div>
                  <ChevronRight size={18} className="absolute right-5 bottom-5 text-[--color-text-tertiary] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions Placeholder */}
          <div className="bento-span-12 lg:bento-span-4 animate-fade-up-in stagger-5 flex flex-col gap-6">
            <div className="bento-card p-6 h-full">
              <h3 className="text-card-heading mb-6">System Jobs</h3>
              <div className="space-y-4">
                <button className="btn-ghost w-full text-left flex justify-between items-center px-4 py-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  Process Month End
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button className="btn-ghost w-full text-left flex justify-between items-center px-4 py-3 text-[--color-error] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  Run Downgrade Job
                  <ChevronRight className="h-4 w-4" />
                </button>
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
