import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
