import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FileUp, Users, Inbox, Coins, ChevronRight, UserCheck, Zap, LayoutDashboard } from "lucide-react";
import { RedemptionQueueTable } from "@/features/admin/redemption-queue-table";
import { DashboardClock } from "@/components/dashboard/dashboard-clock";
import { auth, getServerToken } from "@/lib/auth";
import { adminApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await auth();
  const token = await getServerToken();
  const userName = session?.user?.name || "Admin";

  let redemptionRes: import("@/lib/api-client").AdminRedemptionResponse | null = null;
  let userRes: import("@/lib/api-client").AdminUserListResponse | null = null;
  let settings: import("@/lib/api-client").SystemSettingsResponse | null = null;

  try {
    const results = await Promise.allSettled([
      adminApi.listRedemptions(token, { limit: 100 }), // Large enough for dashboard summary
      adminApi.listUsers(token, { limit: 1000 }),     // Need all for kpi calculation
      adminApi.getSystemSettings(token),
    ]);

    if (results[0].status === "fulfilled") redemptionRes = results[0].value;
    if (results[1].status === "fulfilled") userRes = results[1].value;
    if (results[2].status === "fulfilled") settings = results[2].value;
  } catch (error) {
    console.warn("Failed to load dashboard data:", error);
  }

  // ── Dynamic Earning Period Logic ──────────────────────────────────────────
  const now = new Date();
  const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  let activePeriodLabel = "Unknown";
  let activePeriodDates = "";
  let activeClaimLabel = "Unknown";
  let activeClaimDates = "";

  if (settings) {
    const { p1Start, p1End, p2Start, p2End, claimP1Start, claimP1End, claimP2Start, claimP2End } = settings;
    
    // Helper to format MM-DD to MMM DD
    const formatDateStr = (mmdd: string) => {
      const [m, d] = mmdd.split("-");
      const date = new Date(2000, parseInt(m) - 1, parseInt(d));
      return date.toLocaleString('en-GB', { month: 'short', day: 'numeric' });
    };

    const p1RangeStr = `${formatDateStr(p1Start)} → ${formatDateStr(p1End)}`;
    const p2RangeStr = `${formatDateStr(p2Start)} → ${formatDateStr(p2End)}`;
    const claimP1RangeStr = `${formatDateStr(claimP1Start)} → ${formatDateStr(claimP1End)}`;
    const claimP2RangeStr = `${formatDateStr(claimP2Start)} → ${formatDateStr(claimP2End)}`;

    // Logic for P1 (Usually same year)
    if (p1Start <= p1End) {
      if (currentMonthDay >= p1Start && currentMonthDay <= p1End) {
        activePeriodLabel = "P1";
        activePeriodDates = p1RangeStr;
      }
    } else {
      if (currentMonthDay >= p1Start || currentMonthDay <= p1End) {
        activePeriodLabel = "P1";
        activePeriodDates = p1RangeStr;
      }
    }

    // Logic for P2
    if (activePeriodLabel === "Unknown") {
      if (p2Start <= p2End) {
        if (currentMonthDay >= p2Start && currentMonthDay <= p2End) {
          activePeriodLabel = "P2";
          activePeriodDates = p2RangeStr;
        }
      } else {
        if (currentMonthDay >= p2Start || currentMonthDay <= p2End) {
          activePeriodLabel = "P2";
          activePeriodDates = p2RangeStr;
        }
      }
    }

    // Check Claim P1
    if (claimP1Start <= claimP1End) {
      if (currentMonthDay >= claimP1Start && currentMonthDay <= claimP1End) {
        activeClaimLabel = "P1";
        activeClaimDates = claimP1RangeStr;
      }
    } else {
      if (currentMonthDay >= claimP1Start || currentMonthDay <= claimP1End) {
        activeClaimLabel = "P1";
        activeClaimDates = claimP1RangeStr;
      }
    }

    // Check Claim P2 if P1 not active
    if (activeClaimLabel === "Unknown") {
      if (claimP2Start <= claimP2End) {
        if (currentMonthDay >= claimP2Start && currentMonthDay <= claimP2End) {
          activeClaimLabel = "P2";
          activeClaimDates = claimP2RangeStr;
        }
      } else {
        if (currentMonthDay >= claimP2Start || currentMonthDay <= claimP2End) {
          activeClaimLabel = "P2";
          activeClaimDates = claimP2RangeStr;
        }
      }
    }

    if (activeClaimLabel === "Unknown") {
      activeClaimLabel = "P1";
      activeClaimDates = claimP1RangeStr;
    }
  }

  const requests = redemptionRes?.requests ?? [];
  const users = userRes?.users ?? [];

  // Map to the shape expected by the UI component
  const mapped = requests.map((r) => ({
    id: r.id,
    mitraName: r.mitra?.name ?? "—",
    division: r.mitra?.division ?? "—",
    rewardName: r.item?.name ?? "—",
    tokenCost: r.item?.tokenCost ?? 0,
    status: r.status as any,
    submittedAt: r.createdAt,
    // Add extra fields needed by the drawer
    userId: r.mitra?.id ?? "",
    userNpk: r.mitra?.npk ?? "—",
    userDocuments: r.mitra?.documents ?? [],
    rewardId: r.item?.id ?? "",
    tokensSpent: r.item?.tokenCost ?? 0,
    isRepresented: r.isRepresented,
    powerOfAttorneyUrl: r.powerOfAttorneyUrl,
    rejectReason: r.rejectReason,
  }));

  const requestedCount = requests.filter(r => r.status === "REQUESTED").length;
  const activePartnersCount = users.filter(u => u.partnerStatus === "ACTIVE").length;
  const totalTokensIssued = users.reduce((sum, u) => sum + (u.tokens ?? 0), 0);

  // Calculate Tier Distribution
  const tierDistribution = users.reduce((acc, user) => {
    const tier = (user.membershipTier || "SAPHIRE").toUpperCase() as keyof typeof acc;
    if (acc[tier] !== undefined) acc[tier]++;
    return acc;
  }, { SAPHIRE: 0, EMERALD: 0, RUBY: 0, DIAMOND: 0 });

  const totalUsersWithTier = Object.values(tierDistribution).reduce((a, b) => a + b, 0);

  // Format tokens (e.g., 14200 -> 14.2k)
  const formatTokens = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bento-grid">
          {/* Active Period Banner */}
          <div className="bento-span-12 bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5 shrink-0"> 
                <LayoutDashboard size={28} />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">HC Admin Dashboard</h1>
                <p className="text-sm text-[--color-text-secondary] font-medium leading-none">
                  Welcome back, <span className="font-bold">{userName}</span>! Monitor and manage rewards below.
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <DashboardClock />
            </div>
          </div>

          {/* KPI Cards */}
          {/* Employee Tier Distribution */}
          <div className="bento-span-12 md:bento-span-4 bento-card p-6 flex flex-col bg-gradient-to-br from-[--color-surface-elevated] to-[--color-surface-base] relative overflow-hidden group min-h-[220px] shadow-sm animate-fade-up-in stagger-1">
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-[10px] font-black tracking-[0.2em] uppercase mb-6 opacity-60 text-[--color-text-secondary]">
                Employee Tier Distribution
              </h3>
              
              <div className="flex-1 flex flex-col justify-center gap-3">
                {[
                  { label: "Saphire", key: "SAPHIRE", color: "bg-blue-500", text: "text-blue-500" },
                  { label: "Emerald", key: "EMERALD", color: "bg-emerald-500", text: "text-emerald-500" },
                  { label: "Ruby",    key: "RUBY",    color: "bg-red-500",     text: "text-red-500" },
                  { label: "Diamond", key: "DIAMOND", color: "bg-purple-500",  text: "text-purple-500" },
                ].map((tier) => {
                  const count = tierDistribution[tier.key as keyof typeof tierDistribution] || 0;
                  const percentage = totalUsersWithTier > 0 ? (count / totalUsersWithTier) * 100 : 0;

                  return (
                    <div key={tier.key} className="space-y-1">
                      <div className="flex justify-between items-end">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", tier.text)}>{tier.label}</span>
                        <span className="text-[10px] font-black text-[--color-text-primary]">{count}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-1000", tier.color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-all duration-1000 pointer-events-none">
              <Users size={180} />
            </div>
          </div>

          <div className="bento-span-12 md:bento-span-4 bento-card p-6 flex flex-col bg-gradient-to-br from-[--color-surface-elevated] to-[--color-surface-base] relative overflow-hidden group min-h-[220px] shadow-sm animate-fade-up-in stagger-2">
            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Top Section: Requested Redeem */}
              <div className="flex items-center justify-between pb-4">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-60 text-[--color-text-secondary]">
                    Requested Redeem
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-black text-amber-500 font-display tracking-tighter leading-none">{requestedCount}</p>
                    <span className="text-[10px] font-bold text-amber-500/60 uppercase">Pending</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-sm shadow-amber-500/5">
                  <Inbox size={22} />
                </div>
              </div>

              {/* Dedicated Horizontal Divider */}
              <div className="h-[2px] w-full bg-slate-200 my-2" />

              {/* Bottom Section: Active Partners */}
              <div className="flex items-center justify-between pt-4">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-60 text-[--color-text-secondary]">
                    Active Partners
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-black text-emerald-500 font-display tracking-tighter leading-none">{activePartnersCount}</p>
                    <span className="text-[10px] font-bold text-emerald-500/60 uppercase">Verified</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                  <Users size={22} />
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-all duration-1000 pointer-events-none">
              <Zap size={180} />
            </div>
          </div>

          <div className="bento-span-12 md:bento-span-4 bento-card p-6 flex flex-col bg-gradient-to-br from-[--color-surface-elevated] to-[--color-surface-base] relative overflow-hidden group min-h-[220px] shadow-sm animate-fade-up-in stagger-3">
            <div className="absolute -bottom-10 -right-10 opacity-[0.04] group-hover:scale-110 group-hover:opacity-[0.07] transition-all duration-1000 pointer-events-none text-blue-900">
              <Coins size={240} />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-[10px] font-black tracking-[0.2em] uppercase mb-4 opacity-60 text-[--color-text-secondary]">
                Tokens Issued
              </h3>
              <div className="flex-1 flex flex-col justify-center mb-6">
                <p className="text-7xl font-black text-blue-500 font-display tracking-tighter leading-none">{formatTokens(totalTokensIssued)}</p>
              </div>
              <div className="mt-auto pt-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-[--color-text-secondary]">Total Distribution</div>
              </div>
            </div>
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-[--color-text-tertiary]">Redemption Queue</h3>
              <Link
                href="/admin/redemptions"
                className="text-xs font-bold uppercase tracking-widest text-[--color-text-tertiary] hover:text-[--color-text-primary] hover:bg-slate-50 px-2 py-1 rounded-md flex items-center gap-1 transition-all"
              >
                View All
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <RedemptionQueueTable initialRequests={mapped} />
          </div>

        </div>
      </main>
    </div>
  );
}
