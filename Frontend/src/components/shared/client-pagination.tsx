"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export function ClientPagination({ 
  currentPage, 
  totalPages, 
  totalResults, 
  onPageChange,
  itemsPerPage = 10 
}: ClientPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-6 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/20">
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-[var(--color-text-tertiary)]">
          Showing <span className="text-[var(--color-text-secondary)] font-bold">{totalResults > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="text-[var(--color-text-secondary)] font-bold">{Math.min(currentPage * itemsPerPage, totalResults)}</span> of <span className="text-[var(--color-text-secondary)] font-bold">{totalResults}</span> records
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            "flex items-center justify-center h-10 px-4 rounded-lg border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all disabled:pointer-events-none disabled:opacity-30 disabled:bg-slate-50"
          )}
        >
          <ChevronLeft size={18} className="mr-1" />
          Previous
        </button>

        <div className="flex items-center justify-center h-10 px-4 text-sm font-bold text-slate-500">
          {currentPage} / {totalPages}
        </div>

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            "flex items-center justify-center h-10 px-4 rounded-lg border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all disabled:pointer-events-none disabled:opacity-30 disabled:bg-slate-50"
          )}
        >
          Next
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>
    </div>
  );
}
