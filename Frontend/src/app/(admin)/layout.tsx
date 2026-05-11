"use client";

import { ReactNode } from "react";
import {
  BarChart3,
  Database,
  FileSpreadsheet,
  Gift,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { AppNavbar, type NavItem } from "@/frontend/components/layout/app-navbar";

// ── Nav config ─────────────────────────────────────────────────
const navItems: NavItem[] = [
  { href: "/admin/dashboard",   label: "Dashboard",   icon: BarChart3       },
  { href: "/admin/uploads",     label: "Uploads",     icon: FileSpreadsheet },
  { href: "/admin/redemptions", label: "Redemptions", icon: Gift            },
  { href: "/admin/snapshots",   label: "Snapshots",   icon: Database        },
  { href: "/admin/audit",       label: "Audit Log",   icon: ScrollText      },
];

// ── Admin badge (right widget) ─────────────────────────────────
function AdminBadge() {
  return (
    <div className="hidden sm:flex flex-col items-end">
      <span className="text-xs font-semibold text-foreground">HC PM Admin</span>
      <span className="text-xs text-muted-foreground">admin@berijalan.id</span>
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppNavbar
        brandName="Berijalan HC PM"
        brandIcon={ShieldCheck}
        navItems={navItems}
        profileLabel="HC PM Admin"
        rightWidget={<AdminBadge />}
      />

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
