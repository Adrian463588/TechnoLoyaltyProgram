"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, User, ChevronDown, Moon, Sun } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { NotificationDropdown } from "./notification-dropdown";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const role = (session?.user?.role as string) || "MITRA";
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const profileHref = role === "HC_PM" ? "/admin/profile" : 
                      role === "TEAM_LEADER" ? "/leader/profile" : 
                      "/employee/profile";

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <LazyMotion features={domAnimation}>
    <m.header
      className="h-16 app-nav shrink-0 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50"
    >
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Button */}
        {onMenuClick && (
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="lg:hidden p-2.5 text-muted-foreground rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </m.button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          data-testid="theme-toggle"
          aria-label={mounted && resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-[var(--color-surface-muted)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {mounted && resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell */}
        <NotificationDropdown />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid={mounted ? "profile-menu-trigger" : undefined}
            className="!outline-none !ring-0 focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
          >
            <m.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-slate-100 transition-colors cursor-pointer !outline-none !ring-0"
            >
              <m.div
                whileHover={{ rotate: 10 }}
                className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary overflow-hidden"
              >
                <User size={18} />
              </m.div>
              <span className="hidden md:block text-sm font-medium text-foreground max-w-32 truncate">
                {session?.user?.name || "Account"}
              </span>
              <ChevronDown
                size={14}
                className="hidden md:block text-muted-foreground"
              />
            </m.div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 bg-[var(--color-surface)] border-[var(--color-border)] p-2 shadow-lg rounded-xl"
          >
            <div data-testid="profile-menu-content">
              <AnimatePresence mode="wait">
                <m.div
                  key="dropdown-content"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                <DropdownMenuLabel className="flex items-center gap-3 p-2 rounded-xl bg-[var(--color-surface-muted)]">
                  <m.div
                    whileHover={{ rotate: 10 }}
                    className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary overflow-hidden"
                  >
                    <User size={20} />
                  </m.div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-foreground">
                      {session?.user?.name || "Account"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono tracking-tighter">
                      {(session?.user as { npk?: string })?.npk || "NPK-XXXX"} • {role}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-2 bg-border" />

                <DropdownMenuItem
                  onClick={() => router.push(profileHref as string as never)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-surface-muted)] focus:bg-[var(--color-surface-muted)]"
                >
                    <m.div whileHover={{ x: 2 }}>
                      <User size={16} />
                    </m.div>
                    <span>Profile Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-border" />

                <DropdownMenuItem
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors"
                >
                  <m.div
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <LogOut size={16} />
                  </m.div>
                  <span className="font-medium">Sign out</span>
                </DropdownMenuItem>
                </m.div>
              </AnimatePresence>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-0 overflow-hidden max-w-sm">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut size={32} />
            </div>
            <DialogHeader className="mb-0 p-0">
              <DialogTitle className="text-xl font-bold text-[var(--color-text-primary)] text-center">Confirm Sign Out</DialogTitle>
              <DialogDescription className="text-[var(--color-text-muted)] text-sm leading-relaxed text-center mt-2">
                Are you sure you want to sign out of your account? You will need to log in again to access the portal.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 flex flex-row gap-3 mt-0">
            <Button
              variant="outline" 
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 rounded-xl border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors"
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
    </m.header>
    </LazyMotion>
  );
}
