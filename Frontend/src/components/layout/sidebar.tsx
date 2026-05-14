"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, ShoppingBag, History, FileUp, 
  Users, CheckSquare, X, LogOut, Settings
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
    <AnimatePresence mode="wait">
      <>
        {/* Mobile Backdrop with blur */}
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Sidebar */}
        <motion.aside 
          initial={{ x: -280 }}
          animate={{ x: isOpen || typeof window !== 'undefined' && window.innerWidth >= 1024 ? 0 : -280 }}
          exit={{ x: -280 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            opacity: { duration: 0.2 }
          }}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 glass-elevated lg:glass-card border-l-0 border-t-0 border-b-0 rounded-none lg:relative transform flex flex-col shrink-0",
            // On desktop, always show; on mobile, show when open
            "lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[--color-border-subtle] shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="h-9 w-9 rounded-xl bg-[--color-accent] flex items-center justify-center text-[#0F172A] shadow-lg shadow-[--color-accent]/30"
              >
                <LayoutDashboard size={20} />
              </motion.div>
              <span className="font-display font-bold text-xl text-[--color-text-primary] tracking-tight">
                Berijalan
              </span>
            </Link>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="lg:hidden p-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-lg hover:bg-[--color-border-subtle] transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {links.map((link, index) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    href={link.href as any}
                    onClick={() => onClose()}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium overflow-hidden group",
                      isActive 
                        ? "bg-[--color-accent-muted] text-[--color-accent] border border-[--color-border-accent]" 
                        : "text-[--color-text-secondary] hover:text-[--color-text-primary] border border-transparent"
                    )}
                  >
                    {/* Hover background effect */}
                    <motion.div 
                      className="absolute inset-0 bg-[--color-accent]/5 rounded-xl"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[--color-accent] rounded-r-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                    
                    {/* Icon with animation */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: isActive ? 0 : 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Icon 
                        size={18} 
                        className={cn(
                          "transition-colors duration-200",
                          isActive ? "text-[--color-accent]" : "text-[--color-text-secondary] group-hover:text-[--color-text-primary]"
                        )} 
                      />
                    </motion.div>
                    
                    {/* Label */}
                    <span className="relative z-10">{link.label}</span>
                    
                    {/* Arrow indicator on hover */}
                    <motion.span 
                      className="absolute right-4 text-[--color-accent] opacity-0"
                      initial={{ x: -10, opacity: 0 }}
                      whileHover={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      →
                    </motion.span>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* Footer with user info and settings */}
          <div className="border-t border-[--color-border-subtle] p-4 space-y-2">
            {/* Settings Link */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href={"/settings" as any}
                onClick={() => onClose()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-border-subtle] transition-all duration-200 group"
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Settings size={18} />
                </motion.div>
                <span>Settings</span>
              </Link>
            </motion.div>

            {/* User Info */}
            <motion.div 
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[--color-border-subtle]/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="h-9 w-9 rounded-full bg-[--color-accent-muted] flex items-center justify-center border border-[--color-border-accent]">
                <span className="text-[--color-accent] font-bold text-sm">
                  {session?.user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[--color-text-primary] truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-[10px] text-[--color-text-secondary] font-mono">
                  {role}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}
