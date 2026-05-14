import React from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Upload, Users, ShoppingBag, Coins, ChevronRight } from "lucide-react";
import { RedemptionQueueTable } from "@/features/admin/redemption-queue-table";
import { ManualTokenAdjustment } from "@/features/admin/manual-token-adjustment";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bento-grid">
          {/* Active Period Banner */}
          <div className="col-span-12 glass-card p-6 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div>
              <h1 className="text-card-heading text-2xl mb-1">HC Admin Dashboard</h1>
              <p className="text-[--color-text-secondary]">Active Earning Period: P2 (Jun 16 → Dec 15)</p>
            </div>
            <div className="mt-4 md:mt-0 px-4 py-2 bg-[--color-accent-muted] text-[--color-accent] rounded-full text-sm font-semibold border border-[--color-border-accent]">
              System Status: Nominal
            </div>
          </div>

          {/* KPI Cards */}
          <div className="col-span-12 md:col-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-1">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <Upload className="h-[14px] w-[14px] text-[--color-text-secondary]" />
              Uploads This Month
            </h3>
            <p className="text-metric-hero text-[--color-text-primary]">4</p>
          </div>

          <div className="col-span-12 md:col-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-2" data-interactive="true">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <ShoppingBag className="h-[14px] w-[14px] text-[--color-warning]" />
              Pending Redeem
            </h3>
            <p className="text-metric-hero text-[--color-warning]">12</p>
          </div>

          <div className="col-span-12 md:col-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-3">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <Users className="h-[14px] w-[14px] text-[--color-info]" />
              Active Partners
            </h3>
            <p className="text-metric-hero text-[--color-info]">248</p>
          </div>

          <div className="col-span-12 md:col-span-3 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-4">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <Coins className="h-[14px] w-[14px] text-[--color-accent]" />
              Tokens Issued
            </h3>
            <p className="text-metric-hero text-[--color-accent]">14.2k</p>
          </div>

          {/* Upload Activity Table */}
          <div className="col-span-12 lg:col-span-8 glass-card p-6 animate-fade-up-in stagger-5 min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-card-heading">Recent Upload Activity</h3>
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-label border-b border-[--color-border-subtle]">
                    <th className="pb-3 px-4 font-medium">Date</th>
                    <th className="pb-3 px-4 font-medium">Filename</th>
                    <th className="pb-3 px-4 font-medium">Rows</th>
                    <th className="pb-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[1, 2, 3].map((_, i) => (
                    <tr key={i} className="table-row border-b border-[--color-border-subtle] last:border-0">
                      <td className="py-4 px-4 text-[--color-text-secondary]">Oct 12, 2026</td>
                      <td className="py-4 px-4 font-medium text-[--color-text-primary]">loyalty-optel-oct.tsv</td>
                      <td className="py-4 px-4 font-mono text-[--color-text-secondary]">124</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-[0.06em] uppercase bg-[--color-accent-muted] text-[--color-success]">
                          COMPLETED
                        </span>
                        <div className="table-cell-action inline-block ml-4 text-[--color-brand-hover]">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions & Manual Adjustment */}
          <div className="col-span-12 lg:col-span-4 animate-fade-up-in stagger-5 flex flex-col gap-6">
            <div className="glass-card p-6">
              <h3 className="text-card-heading mb-6">Quick Actions</h3>
              <div className="space-y-4">
                <button className="btn-primary w-full text-left flex justify-between items-center px-4 py-3">
                  Upload Data File
                  <Upload className="h-4 w-4" />
                </button>
                <button className="btn-ghost w-full text-left flex justify-between items-center px-4 py-3">
                  Process Month End
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button className="btn-ghost w-full text-left flex justify-between items-center px-4 py-3 text-[--color-error]">
                  Run Downgrade Job
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Manual Token Adjustment Form */}
            <ManualTokenAdjustment />
          </div>
          
          {/* Redemption Queue Table */}
          <div className="col-span-12 glass-card p-6 animate-fade-up-in stagger-5 min-h-[300px]">
            <h3 className="text-card-heading mb-6">Redemption Queue</h3>
            <RedemptionQueueTable />
          </div>

        </div>
      </main>
    </div>
  );
}

