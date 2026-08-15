"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export function Pagination({ currentPage, totalPages, totalResults }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-6 border-t border-slate-200 bg-white">
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-slate-500">
          Showing <span className="text-slate-700 font-bold">{totalResults > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> to <span className="text-slate-700 font-bold">{Math.min(currentPage * 10, totalResults)}</span> of <span className="text-slate-700 font-bold">{totalResults}</span> records
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        <Link 
          href={createPageURL(currentPage - 1) as Route}
          className={cn(
            "flex items-center justify-center h-10 px-4 rounded-lg border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all",
            currentPage <= 1 && "pointer-events-none opacity-30 bg-slate-50"
          )}
        >
          <ChevronLeft size={18} className="mr-1" />
          Previous
        </Link>

        <div className="flex items-center justify-center h-10 px-4 text-sm font-bold text-slate-500">
          {currentPage} / {totalPages}
        </div>

        <Link 
          href={createPageURL(currentPage + 1) as Route}
          className={cn(
            "flex items-center justify-center h-10 px-4 rounded-lg border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all",
            currentPage >= totalPages && "pointer-events-none opacity-30 bg-slate-50"
          )}
        >
          Next
          <ChevronRight size={18} className="ml-1" />
        </Link>
      </div>
    </div>
  );
}
