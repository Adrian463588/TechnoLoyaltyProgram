"use client";

import React, { useState, useMemo } from "react";
import { 
  Zap, 
  X, 
  Search, 
  Shield, 
  Users, 
  Trophy, 
  Key,
  ChevronRight,
  UserCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEMO_ACCOUNTS = [
  { group: "Administrator", items: [
    { label: "Admin HC", npk: "12345", password: "password123", role: "HC_PM", icon: Shield },
  ]},
  { group: "Team Leader", items: [
    { label: "Leader OpCent", npk: "23456", password: "password123", role: "TEAM_LEADER", icon: Users },
    { label: "Leader Tele", npk: "23457", password: "password123", role: "TEAM_LEADER", icon: Users },
    { label: "Leader Techno", npk: "23458", password: "password123", role: "TEAM_LEADER", icon: Users },
  ]},
  { group: "Employee (Mitra)", items: [
    { label: "Alice (Emerald)", npk: "34567", password: "password123", role: "MITRA", icon: Trophy },
    { label: "Saphire (Saphire)", npk: "40001", password: "password123", role: "MITRA", icon: Trophy },
    { label: "Emerald (Emerald)", npk: "40002", password: "password123", role: "MITRA", icon: Trophy },
    { label: "Ruby (Ruby)", npk: "40003", password: "password123", role: "MITRA", icon: Trophy },
    { label: "Diamond (Diamond)", npk: "40004", password: "password123", role: "MITRA", icon: Trophy },
    { label: "Eve (Inactive)", npk: "40005", password: "password123", role: "MITRA", icon: Trophy },
    { label: "Frank (Resigned)", npk: "40006", password: "password123", role: "MITRA", icon: Trophy },
  ]},
];

interface DemoAccountDockProps {
  onSelect: (npk: string, pass: string) => void;
}

export function DemoAccountDock({ onSelect }: DemoAccountDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAccounts = useMemo(() => {
    if (!search) return DEMO_ACCOUNTS;
    
    return DEMO_ACCOUNTS.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(search.toLowerCase()) || 
        item.npk.includes(search)
      )
    })).filter(group => group.items.length > 0);
  }, [search]);

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 h-14 w-14 rounded-full bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center border-4 border-white/30 hover:brightness-110 transition-all group"
      >
        <UserCircle className="h-8 w-8" />
      </motion.button>

      {/* Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="demo-dock-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/10 backdrop-blur-[2px] w-full h-full"
            />

            {/* Panel */}
            <motion.div
              key="demo-dock-panel"
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 z-[60] w-full max-w-sm bg-white shadow-2xl flex flex-col border-r border-slate-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-none">Account Selector</h3>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Demo Environment</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-9 w-9 flex items-center justify-center hover:bg-slate-100 text-slate-400 shrink-0" 
                  onClick={() => setIsOpen(false)}
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Enhanced Search Bar */}
              <div className="px-6 py-4 bg-white">
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                    <Search className="text-slate-400 group-focus-within:text-primary transition-colors" size={15} />
                  </div>
                  <Input 
                    placeholder="Search account name or NPK..." 
                    className="!pl-12 h-11 bg-slate-50 border-slate-200/60 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:border-primary/30 focus-visible:bg-white transition-all shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((group) => (
                    <div key={group.group} className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                        {group.group}
                      </h4>
                      <div className="grid gap-2">
                        {group.items.map((item) => (
                          <motion.button
                            key={item.npk}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onSelect(item.npk, item.password);
                              setIsOpen(false);
                            }}
                            className="w-full group flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-white hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all text-left"
                          >
                            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <item.icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-700 truncate">{item.label}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">NPK</span>
                                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {item.npk}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pass</span>
                                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                                    {item.password}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                      <Search size={32} />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No accounts found</p>
                    <p className="text-xs text-slate-400 mt-1">Try a different name or NPK</p>
                  </div>
                )}
              </div>

              {/* Footer Tip */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <Key size={14} className="text-blue-500" />
                  <p className="text-[10px] font-medium text-blue-700 leading-tight">
                    Tip: Click any account to automatically fill the login fields and close this panel.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
