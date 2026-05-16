"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { SessionProvider } from "next-auth/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
          
          <main className="flex-1 overflow-y-auto hide-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
