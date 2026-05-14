import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function LeaderLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
