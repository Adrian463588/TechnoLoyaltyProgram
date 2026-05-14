"use client";

import React from "react";
import { Menu, LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession();

  return (
    <header className="h-16 glass-nav shrink-0 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-lg hover:bg-[--color-border-subtle] transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent] rounded-full">
            <div className="h-9 w-9 rounded-full bg-[--color-accent-muted] flex items-center justify-center border border-[--color-border-accent] text-[--color-accent]">
              <User size={18} />
            </div>
            <span className="hidden md:block text-sm font-medium text-[--color-text-primary]">
              {session?.user?.name || "Account"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass-elevated border-[--color-border-glass]">
            <DropdownMenuItem className="focus:bg-[--color-border-subtle] focus:text-[--color-text-primary] cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => signOut()}
              className="text-[--color-error] focus:bg-red-500/10 focus:text-[--color-error] cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
