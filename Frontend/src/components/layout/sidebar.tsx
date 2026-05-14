"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, ShoppingBag, History, FileUp, 
  Users, CheckSquare, X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role || "MITRA";

  const getLinks = () => {
    switch (role) {
      case "HC_ADMIN":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/uploads", label: "Monthly Uploads", icon: FileUp },
          { href: "/admin/redemptions", label: "Redemptions", icon: CheckSquare },
          { href: "/admin/audit", label: "Audit Log", icon: History },
        ];
      case "TEAM_LEAD":
        return [
          { href: "/leader/team", label: "Team Overview", icon: Users },
          { href: "/employee/dashboard", label: "My Dashboard", icon: LayoutDashboard },
          { href: "/employee/rewards", label: "Rewards", icon: ShoppingBag },
        ];
      case "MITRA":
      default:
        return [
          { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/employee/rewards", label: "Rewards", icon: ShoppingBag },
          { href: "/employee/history", label: "History", icon: History },
        ];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 glass-elevated lg:glass-card border-l-0 border-t-0 border-b-0 rounded-none lg:relative transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[--color-border-subtle] shrink-0">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-[--color-text-primary]">
            <div className="h-8 w-8 rounded-lg bg-[--color-accent] flex items-center justify-center text-[#0F172A]">
              <LayoutDashboard size={18} />
            </div>
            Berijalan
          </Link>
          <button className="lg:hidden text-[--color-text-secondary]" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.href}
                href={link.href}
                onClick={() => onClose()}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                  isActive 
                    ? "bg-[--color-accent-muted] text-[--color-accent] border border-[--color-border-accent]" 
                    : "text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-border-subtle] border border-transparent"
                )}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  );
}
