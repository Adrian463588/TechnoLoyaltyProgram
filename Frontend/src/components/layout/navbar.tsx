"use client";

import React, { useState } from "react";
import { Menu, LogOut, User, Bell, Search, ChevronDown, CreditCard } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession();
  const role = (session?.user?.role as string) || "MITRA";
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-16 app-nav shrink-0 flex items-center justify-between px-4 md:px-6 relative z-30"
    >
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMenuClick}
          className="lg:hidden p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </motion.button>

        {/* Search Bar with microinteractions */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: 1,
            width: isSearchFocused ? "280px" : "auto",
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            "hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300",
            isSearchFocused
              ? "bg-white border-primary ring-1 ring-primary"
              : "bg-slate-50 border-border"
          )}
        >
          <motion.div
            animate={{ scale: isSearchFocused ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Search
              size={16}
              className={cn(
                "transition-colors",
                isSearchFocused ? "text-primary" : "text-muted-foreground"
              )}
            />
          </motion.div>
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-32 focus:outline-none transition-all"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <AnimatePresence>
            {isSearchFocused && (
              <motion.kbd
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded"
              >
                ⌘K
              </motion.kbd>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications Bell with badge animation */}
        <motion.button
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Bell size={20} />
          {/* Notification badge with pulse */}
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full"
          >
            <motion.span
              className="absolute inset-0 h-full w-full rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.span>
        </motion.button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="profile-menu-trigger"
              className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <motion.div
                whileHover={{ rotate: 10 }}
                className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary overflow-hidden"
              >
                <User size={18} />
              </motion.div>
              <span className="hidden md:block text-sm font-medium text-foreground max-w-32 truncate">
                {session?.user?.name || "Account"}
              </span>
              <ChevronDown
                size={14}
                className="hidden md:block text-muted-foreground"
              />
            </motion.div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 bg-white border border-border p-2 shadow-lg rounded-xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key="dropdown-content"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <DropdownMenuLabel className="flex items-center gap-3 p-2 rounded-xl bg-slate-50">
                  <motion.div
                    whileHover={{ rotate: 10 }}
                    className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary overflow-hidden"
                  >
                    <User size={20} />
                  </motion.div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-foreground">
                      {session?.user?.name || "Account"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono tracking-tighter">
                      {session?.user?.id?.slice(0, 8) || "NPK-XXXX"} • {role}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-2 bg-border" />

                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 focus:bg-slate-100">
                  <motion.div whileHover={{ x: 2 }}>
                    <User size={16} />
                  </motion.div>
                  <span>Profile Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 focus:bg-slate-100">
                  <motion.div whileHover={{ x: 2 }}>
                    <CreditCard size={16} />
                  </motion.div>
                  <span>Payment Methods</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 focus:bg-slate-100">
                  <motion.div whileHover={{ x: 2 }}>
                    <Bell size={16} />
                  </motion.div>
                  <span>Notifications</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-border" />

                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors"
                >
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <LogOut size={16} />
                  </motion.div>
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </motion.div>
            </AnimatePresence>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
