"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  History,
  FileUp,
  Users,
  CheckSquare,
  X,
  LogOut,
  Settings,
  Gift,
  Zap,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = {
  HC_PM: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/uploads", label: "Monthly Uploads", icon: FileUp },
    { href: "/admin/redemptions", label: "Redemptions", icon: CheckSquare },
    { href: "/admin/reward-catalog", label: "Reward Catalog", icon: Gift },
    { href: "/admin/adjustments", label: "Token Adjustments", icon: Zap },
    { href: "/admin/audit", label: "Audit Log", icon: History },
    { href: "/admin/token-rules", label: "Token Rules", icon: Settings },
  ],
  TEAM_LEADER: [
    { href: "/leader/team", label: "Team Overview", icon: Users },
    { href: "/employee/dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/employee/rewards", label: "Rewards", icon: ShoppingBag },
  ],
  MITRA: [
    { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/rewards", label: "Rewards", icon: ShoppingBag },
    { href: "/employee/history", label: "History", icon: History },
  ],
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role as "MITRA" | "TEAM_LEADER" | "HC_PM") || "MITRA";
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const links = navItems[role] || navItems.MITRA;

  return (
    <LazyMotion features={domAnimation}>
    <AnimatePresence mode="wait">
      <>
        {/* Mobile Backdrop with blur */}
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform flex flex-col shrink-0",
            "transition-transform duration-300 ease-in-out",
            "lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <m.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30"
              >
                <LayoutDashboard size={20} />
              </m.div>
              <span className="font-display font-bold text-xl text-foreground tracking-tight">
                Berijalan
              </span>
            </Link>
            <m.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-100 transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </m.button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {links.map((link, index) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              const isHovered = hoveredLink === link.href;

              return (
                <m.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <Link
                    href={link.href as Route}
                    onClick={() => onClose()}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        "transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span>{link.label}</span>
                  </Link>
                </m.div>
              );
            })}
          </nav>

          {/* Footer with user info and settings */}
          <div className="border-t border-border p-4 space-y-2">
            {/* User Info */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sign out"
              data-testid="sidebar-logout"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-primary font-bold text-sm">
                  {session?.user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {role}
                </p>
              </div>
              <m.div
                whileHover={{ x: 2 }}
                className="text-muted-foreground"
              >
                <LogOut size={14} />
              </m.div>
            </button>
          </div>
        </aside>
      </>
    </AnimatePresence>
    </LazyMotion>
  );
}
