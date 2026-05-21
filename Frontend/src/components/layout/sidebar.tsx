"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  Gift,
  Zap,
  Menu,
  UserCheck,
  FileText,
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
  ],
  TEAM_LEADER: [
    { href: "/leader/team", label: "Team Overview", icon: Users },
    { href: "/employee/dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/employee/rewards", label: "Rewards", icon: ShoppingBag },
    { href: "/employee/documents", label: "My Documents", icon: FileText },
  ],
  MITRA: [
    { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/rewards", label: "Rewards", icon: ShoppingBag },
    { href: "/employee/history", label: "History", icon: History },
    { href: "/employee/documents", label: "My Documents", icon: FileText },
  ],
};

export function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const role = (session?.user?.role as "MITRA" | "TEAM_LEADER" | "HC_PM") || "MITRA";

  const links = navItems[role] || navItems.MITRA;

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

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
            "fixed inset-y-0 left-0 z-50 bg-white transform flex flex-col shrink-0 transition-all duration-300 ease-in-out",
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

          {/* Footer with sign out */}
          <div className={cn(
            "p-4",
            isCollapsed && "p-2"
          )}>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title={isCollapsed ? "Sign Out" : ""}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group",
                "bg-red-50/50 hover:bg-red-50 text-red-600 border border-red-100/50 hover:border-red-200",
                isCollapsed && "justify-center px-0 h-12 w-12 mx-auto"
              )}
            >
              <LogOut size={18} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
              {!isCollapsed && (
                <span className="text-sm font-semibold tracking-tight">
                  Sign Out
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* Logout Confirmation Modal */}
        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl p-0 overflow-hidden max-w-sm">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <DialogHeader className="mb-0 p-0">
                <DialogTitle className="text-xl font-bold text-neutral-900 text-center">Confirm Sign Out</DialogTitle>
                <DialogDescription className="text-neutral-500 text-sm leading-relaxed text-center mt-2">
                  Are you sure you want to sign out of your account? You will need to log in again to access the portal.
                </DialogDescription>
              </DialogHeader>
            </div>

            <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 flex flex-row gap-3 mt-0">
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all"
              >
                Sign Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </AnimatePresence>
    </LazyMotion>
  );
}
