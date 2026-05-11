"use client";

import { ReactNode } from "react";
import { Coins, HistoryIcon, LayoutDashboard, ShoppingBag, Trophy } from "lucide-react";
import { AppNavbar, type NavItem } from "@/frontend/components/layout/app-navbar";

// ── Nav config ─────────────────────────────────────────────────
// Defined here so AdminLayout & LeaderLayout follow the same pattern
const navItems: NavItem[] = [
  { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/rewards",   label: "Rewards",   icon: ShoppingBag     },
  { href: "/employee/history",   label: "History",   icon: HistoryIcon     },
];

// ── Token Balance pill (right widget) ─────────────────────────
function TokenBalancePill({ tokens }: { tokens: number }) {
  return (
    <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 backdrop-blur-sm">
      <Coins className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-bold text-primary">{tokens.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">tokens</span>
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────
export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppNavbar
        brandName="Berijalan Loyalty"
        brandIcon={Trophy}
        navItems={navItems}
        profileLabel="Mitra Account"
        profileTriggerId="profile-menu-trigger"
        rightWidget={<TokenBalancePill tokens={4500} />}
      />

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(203,213,225,0.50)",
          boxShadow: "0 -2px 12px rgba(15,35,70,0.08)",
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon className="w-5 h-5" />
            {label}
          </a>
        ))}
      </nav>
      {/* Mobile bottom nav spacer */}
      <div className="md:hidden h-16" />
    </div>
  );
}
