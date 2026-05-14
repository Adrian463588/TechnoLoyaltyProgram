"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

const labelMap: Record<string, string> = {
  employee: "Employee",
  admin: "Admin",
  leader: "Leader",
  dashboard: "Dashboard",
  rewards: "Rewards",
  history: "History",
  uploads: "Monthly Uploads",
  redemptions: "Redemption Requests",
  snapshots: "Snapshots",
  audit: "Audit Log",
  team: "Team Overview",
  alerts: "Alerts",
  login: "Login",
  members: "Members",
};

const LAYOUT_ONLY_SEGMENTS = new Set(["employee", "admin", "leader"]);

function toLabel(segment: string): string {
  return labelMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname();
  const segments = (pathname ?? "").split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = toLabel(seg);
    const isLast = idx === segments.length - 1;
    const isNavigable = !LAYOUT_ONLY_SEGMENTS.has(seg);
    return { href, label, isLast, isNavigable };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 py-3", className)}
    >
      {crumbs.map(({ href, label, isLast, isNavigable }, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className="text-[--color-text-disabled] text-sm select-none">
              /
            </span>
          )}
          {isLast ? (
            <span
              className="text-sm font-medium text-[--color-text-primary]"
              aria-current="page"
            >
              {label}
            </span>
          ) : isNavigable ? (
            <Link
              href={href as any}
              className="text-sm text-[--color-text-secondary] underline-offset-2 hover:underline hover:text-[--color-text-primary] transition-colors duration-150"
            >
              {label}
            </Link>
          ) : (
            <span className="text-sm text-[--color-text-secondary]">
              {label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
