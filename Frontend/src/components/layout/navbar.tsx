"use client";

import React from "react";
import { Menu, LogOut, User, Bell, Search } from "lucide-react";
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

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-16 glass-nav shrink-0 flex items-center justify-between px-4 md:px-6 relative z-30"
    >
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMenuClick}
          className="lg:hidden p-2.5 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-xl hover:bg-[--color-border-subtle] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </motion.button>

        {/* Search Bar (Desktop) */}
        <motion.div 
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[--color-border-subtle]/50 border border-[--color-border-glass] focus-within:border-[--color-accent] focus-within:ring-1 focus-within:ring-[--color-accent] transition-all"
        >
          <Search size={16} className="text-[--color-text-secondary]" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm text-[--color-text-primary] placeholder:text-[--color-text-disabled] w-48 focus:outline-none"
          />
          <motion.span 
            className="text-[10px] text-[--color-text-disabled] border border-[--color-border-subtle] px-1.5 py-0.5 rounded"
          >
            ⌘K
          </motion.span>
        </motion.div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <motion.button
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-xl hover:bg-[--color-border-subtle] transition-colors"
        >
          <Bell size={20} />
          {/* Notification badge */}
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 h-2 w-2 bg-[--color-accent] rounded-full"
          />
        </motion.button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="profile-menu-trigger"
              className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent] rounded-full p-1 pr-3 hover:bg-[--color-border-subtle] transition-colors"
            >
              <motion.div 
                whileHover={{ rotate: 10 }}
                className="h-9 w-9 rounded-full bg-[--color-accent-muted] flex items-center justify-center border border-[--color-border-accent] text-[--color-accent] overflow-hidden"
              >
                <User size={18} />
              </motion.div>
              <span className="hidden md:block text-sm font-medium text-[--color-text-primary] max-w-32 truncate">
                {session?.user?.name || "Account"}
              </span>
            </motion.button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            className="w-64 glass-elevated border-[--color-border-glass] p-2"
          >
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <DropdownMenuLabel className="flex items-center gap-3 p-2 rounded-xl bg-[--color-border-subtle]/30">
                  <motion.div 
                    whileHover={{ rotate: 10 }}
                    className="h-10 w-10 rounded-full bg-[--color-accent-muted] flex items-center justify-center border border-[--color-border-accent] text-[--color-accent] overflow-hidden"
                  >
                    <User size={20} />
                  </motion.div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-[--color-text-primary]">
                      {session?.user?.name || "Account"}
                    </span>
                    <span className="text-[10px] text-[--color-text-secondary] font-mono tracking-tighter">
                      {session?.user?.id?.slice(0, 8) || "NPK-XXXX"} • HC_ADMIN
                    </span>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator className="my-2 bg-[--color-border-subtle]" />
                
                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors focus:bg-[--color-accent-muted] focus:text-[--color-accent]">
                  <User size={16} />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors focus:bg-[--color-accent-muted] focus:text-[--color-accent]">
                  <Bell size={16} />
                  <span>Notifications</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2 bg-[--color-border-subtle]" />
                
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[--color-error] hover:bg-red-500/10 focus:bg-red-500/10 focus:text-[--color-error] transition-colors"
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
