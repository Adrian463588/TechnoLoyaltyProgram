import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatbotWidget } from "@/components/shared/chatbot-widget";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role;
  const allowedRoles = ["MITRA", "TEAM_LEADER", "HC_PM"];
  
  if (role && !allowedRoles.includes(role)) {
    redirect("/login");
  }

  return (
    <AppShell session={session}>
      {children}
      <ChatbotWidget />
    </AppShell>
  );
}
