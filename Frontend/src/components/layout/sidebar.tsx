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
  Menu,
  UserCheck,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = {
  HC_PM: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/uploads", label: "Monthly Uploads", icon: FileUp },
    { href: "/admin/redemptions", label: "Redemptions", icon: CheckSquare },
    { href: "/admin/reward-catalog", label: "Reward Catalog", icon: Gift },
    { href: "/admin/adjustments", label: "Token Adjustments", icon: Zap },
    { href: "/admin/mitra-validation", label: "Mitra Validation", icon: UserCheck },
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

export function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role as "MITRA" | "TEAM_LEADER" | "HC_PM") || "MITRA";

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
            "fixed inset-y-0 left-0 z-50 bg-white border-r border-border transform flex flex-col shrink-0 transition-all duration-300 ease-in-out",
            "lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full",
            isCollapsed ? "w-20" : "w-64"
          )}
        >
          {/* Logo Header */}
          <div className={cn(
            "h-16 flex items-center border-b border-border shrink-0 transition-all duration-300 px-4",
            isCollapsed ? "justify-center" : "justify-between px-6"
          )}>
            <div className="flex items-center gap-3">
              <m.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleCollapse}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Toggle Sidebar"
              >
                <Menu size={22} />
              </m.button>
              {!isCollapsed && (
                <Link href="/" className="flex items-center">
                  <m.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-display font-bold text-xl text-foreground tracking-tight"
                  >
                    Berijalan
                  </m.span>
                </Link>
              )}
            </div>

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
          <nav className={cn(
            "flex-1 overflow-y-auto py-6 px-4 space-y-1 hide-scrollbar",
            isCollapsed && "px-2"
          )}>
            {links.map((link, index) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <m.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={link.href as Route}
                    onClick={() => onClose()}
                    title={isCollapsed ? link.label : ""}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                      isCollapsed && "justify-center px-0 h-11 w-11 mx-auto"
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        "transition-colors shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <m.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="truncate"
                      >
                        {link.label}
                      </m.span>
                    )}
                  </Link>
                </m.div>
              );
            })}
          </nav>

          {/* Footer with user info */}
          <div className={cn(
            "border-t border-border p-4 space-y-2",
            isCollapsed && "p-2"
          )}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-left",
                isCollapsed && "justify-center px-0 h-12 w-12 mx-auto"
              )}
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <span className="text-primary font-bold text-sm">
                  {session?.user?.name?.charAt(0) || "U"}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {role}
                  </p>
                </div>
              )}
              {!isCollapsed && (
                <m.div whileHover={{ x: 2 }} className="text-muted-foreground">
                  <LogOut size={14} />
                </m.div>
              )}
            </button>
          </div>
        </aside>
      </>
    </AnimatePresence>
    </LazyMotion>
  );
}
