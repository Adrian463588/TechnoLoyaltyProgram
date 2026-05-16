/**
 * AppNavbar — Glassmorphism 2.0 Navigation Bar
 *
 * Shared frosted-glass navbar used across all authenticated
 * role layouts (Employee, Leader, Admin). Takes navItems and
 * role metadata as props — does NOT hardcode role logic.
 *
 * Principle: DRY — single navbar implementation, role-agnostic.
 *            SRP — only renders navigation chrome.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CircleUser,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────
export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface AppNavbarProps {
  /** Brand name to display (e.g. "Berijalan Loyalty") */
  brandName: string;
  /** Brand icon component */
  brandIcon: React.ElementType;
  /** Navigation links for this role */
  navItems: NavItem[];
  /** Optional right-side widget (e.g. token balance pill) */
  rightWidget?: React.ReactNode;
  /** Display name in the profile dropdown label */
  profileLabel?: string;
  /** data-testid for the profile trigger */
  profileTriggerId?: string;
}

// ── AppNavbar ─────────────────────────────────────────────────
export function AppNavbar({
  brandName,
  brandIcon: BrandIcon,
  navItems,
  rightWidget,
  profileLabel = "Account",
  profileTriggerId = "profile-menu-trigger",
}: AppNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex w-full flex-col">
      {/* ── Main Header ──────────────────────────────── */}
      <header
        className={cn(
          "sticky top-0 z-20 flex h-16 items-center gap-4 px-4 md:px-6",
          "app-nav"
        )}
      >
        {/* Mobile hamburger */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="flex md:hidden items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>

        {/* Brand */}
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={(navItems[0]?.href ?? "/") as any}
          className="flex items-center gap-2.5 text-lg font-bold text-foreground shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
            <BrandIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden md:block">{brandName}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={href as any}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive(href)
                  ? "bg-primary/10 text-primary shadow-sm shadow-primary/10"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {rightWidget}

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              data-testid={profileTriggerId}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 transition-all duration-200",
                "shadow-sm shadow-primary/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white border border-border shadow-lg rounded-xl">
              <div data-testid="profile-menu-content">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{profileLabel}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer p-0 hover:bg-slate-100 focus:bg-slate-100">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link href={"/employee/profile" as any} className="flex w-full items-center px-2 py-1.5">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer p-0 hover:bg-slate-100 focus:bg-slate-100">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link href={"/employee/settings" as any} className="flex w-full items-center px-2 py-1.5">
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    data-testid="profile-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Mobile Slide-Down Nav ─────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden app-nav border-t border-border px-4 py-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={href as any}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors w-full",
                isActive(href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
