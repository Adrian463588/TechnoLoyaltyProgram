import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role;

  // Allow MITRA, TEAM_LEAD, and HC_ADMIN
  const allowedRoles = ["MITRA", "TEAM_LEAD", "HC_ADMIN"];
  if (role && !allowedRoles.includes(role)) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
