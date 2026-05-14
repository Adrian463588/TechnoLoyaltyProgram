"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const labelMap: Record<string, string> = {
  employee: "Employee",
  admin: "Admin",
  leader: "Leader",
  dashboard: "Dashboard",
  rewards: "Rewards",
  history: "History",
  uploads: "Uploads",
  redemptions: "Redemptions",
  snapshots: "Snapshots",
  audit: "Audit Log",
  team: "Team Overview",
  alerts: "Alerts",
  login: "Login",
};

/**
 * Route segments that are layout/role containers only — they have no
 * dedicated page.tsx and must NOT be rendered as clickable links.
 */
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
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground animate-fade-up-in",
        className
      )}
    >
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="h-3 w-3" />
      </Link>

      {crumbs.map(({ href, label, isLast, isNavigable }) => (
        <span key={href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          {isLast ? (
            <span className="font-medium text-foreground" aria-current="page">
              {label}
            </span>
          ) : isNavigable ? (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={href as any}
              className="hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ) : (
            <span className="text-muted-foreground/70">{label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
