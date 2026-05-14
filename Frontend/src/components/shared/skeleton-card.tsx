import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted animate-skeleton",
        className
      )}
      style={style}
    />
  );
}

export function SkeletonBentoCard({ className, children }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 space-y-4 overflow-hidden",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-36 stagger-1" />
          <Skeleton className="h-3 w-48 stagger-2" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full stagger-1" />
      </div>
      <div className="space-y-2 pt-4">
        <Skeleton className="h-3 w-full stagger-3" />
        <Skeleton className="h-3 w-3/4 stagger-4" />
      </div>
      {children}
    </div>
  );
}

export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 space-y-3",
        className
      )}
    >
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-24 stagger-1" />
      <Skeleton className="h-2 w-full rounded-full stagger-2" />
    </div>
  );
}

export function SkeletonRow({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 border-b border-border last:border-0",
        className
      )}
      style={style}
    >
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-20 stagger-1" />
      </div>
      <Skeleton className="h-4 w-16 stagger-2" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 4, className }: SkeletonProps & { cols?: number }) {
  return (
    <div className={cn("flex items-center gap-4 px-4 py-3 border-b border-border", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3 flex-1", i === 0 && "max-w-[80px]")}
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
