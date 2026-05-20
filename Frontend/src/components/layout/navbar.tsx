"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, User, Bell, ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession();
  const role = (session?.user?.role as string) || "MITRA";
  const router = useRouter();

  return (
    <LazyMotion features={domAnimation}>
    <m.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-16 app-nav shrink-0 flex items-center justify-between px-4 md:px-6 relative z-30"
    >
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Button */}
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMenuClick}
          className="lg:hidden p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </m.button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications Bell with badge animation */}
        <m.button
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-slate-100 transition-colors"
          onClick={() => window.location.assign("/notifications")}
          aria-label="View notifications"
        >
          <Bell size={20} />
          {/* Notification badge with pulse */}
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full"
          >
            <m.span
              className="absolute inset-0 h-full w-full rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </m.span>
        </m.button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <m.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="profile-menu-trigger"
              className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-slate-100 transition-colors cursor-pointer"
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
            className="w-64 bg-white border border-border p-2 shadow-lg rounded-xl"
          >
            <AnimatePresence mode="wait">
              <m.div
                key="dropdown-content"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <DropdownMenuLabel className="flex items-center gap-3 p-2 rounded-xl bg-slate-50">
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
                      {(session?.user as any)?.npk || "NPK-XXXX"} • {role}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-2 bg-border" />

                <DropdownMenuItem
                  onClick={() => router.push("/profile" as string as never)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 focus:bg-slate-100"
                >
                    <m.div whileHover={{ x: 2 }}>
                      <User size={16} />
                    </m.div>
                    <span>Profile Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-border" />

                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors"
                >
                  <m.div
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <LogOut size={16} />
                  </m.div>
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </m.div>
            </AnimatePresence>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </m.header>
    </LazyMotion>
  );
}
