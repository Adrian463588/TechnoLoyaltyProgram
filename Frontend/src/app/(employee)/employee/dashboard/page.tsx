import React from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { TokenHeroSection } from "@/components/dashboard/token-hero-section";
import { ShoppingBag, TrendingUp, ChevronRight } from "lucide-react";

// Mock data fetcher
async function getDashboardData() {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    tokenBalance: 4200,
    tier: "EMERALD" as const,
    eligibilityStatus: { eligible: true },
    period: "P2: Jun 16 → Dec 15",
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bento-grid">
          {/* Welcome Banner */}
          <div className="col-span-12 glass-card p-6 flex items-center justify-between animate-fade-up-in">
            <div>
              <h1 data-testid="employee-dashboard-heading" className="text-3xl font-bold tracking-tight text-[--color-text-primary]">Dashboard</h1>
              <p className="text-[--color-text-secondary] text-sm mt-1">Active Earning Period: {data.period}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="col-span-12 md:col-span-4 flex animate-fade-up-in stagger-1">
             <TokenHeroSection 
               tokenBalance={data.tokenBalance} 
               tier={data.tier} 
               eligibilityStatus={data.eligibilityStatus} 
             />
          </div>

          <div className="col-span-12 md:col-span-4 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-2" data-interactive="true">
            <h3 className="text-label flex items-center gap-2 mb-4">
              <TrendingUp className="h-[14px] w-[14px]" />
              Earning Streak
            </h3>
            <div className="mb-6">
              <p className="text-metric-hero text-[--color-text-primary]">5 Mos</p>
            </div>
            <div className="border-t border-[--color-border-subtle] pt-4 mt-auto text-[--color-text-secondary] text-sm">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-2" data-testid="employee-dashboard-tier-progress">
                <div className="h-full bg-[--color-accent] w-3/4" />
              </div>
              Keep going to maintain Emerald!
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 bento-card p-6 flex flex-col justify-between animate-fade-up-in stagger-3" data-interactive="true">
             <h3 className="text-label flex items-center gap-2 mb-4">
              <ShoppingBag className="h-[14px] w-[14px]" />
              Redemption
            </h3>
            <div className="mb-6">
               <p className="text-metric-hero text-[--color-text-primary]">Ready</p>
            </div>
            <div className="border-t border-[--color-border-subtle] pt-4 mt-auto">
               <button className="btn-primary w-full text-sm py-2" data-testid="employee-dashboard-redeem-button">Browse Catalog</button>
            </div>
          </div>

          {/* Token History & Rewards (Placeholders for Bento shape) */}
          <div className="col-span-12 lg:col-span-8 glass-card p-6 min-h-[300px] animate-fade-up-in stagger-4">
             <h3 className="text-card-heading mb-4">Token History</h3>
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded bg-white/5" data-testid={`employee-dashboard-activity-${i}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[--color-accent]/20 flex items-center justify-center text-[--color-accent]">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Monthly Token Award</p>
                        <p className="text-xs text-[--color-text-secondary]">Oct 2024 • Opcent Division</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[--color-accent]">+120</p>
                  </div>
                ))}
              </div>
          </div>

          <div className="col-span-12 lg:col-span-4 glass-card p-6 min-h-[300px] flex flex-col animate-fade-up-in stagger-5">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-card-heading">Upcoming Rewards</h3>
               <button className="btn-icon">
                 <ChevronRight className="h-4 w-4" />
               </button>
             </div>
             <div className="flex-1 rounded bg-[--color-border-subtle] flex items-center justify-center text-[--color-text-disabled]">
               Catalog Preview
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
