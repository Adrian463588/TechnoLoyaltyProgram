// All portal routes depend on next-auth session (auth()/getServerToken()).
// Session is only available at request time, not build time.
// force-dynamic opts ALL child routes out of static prerendering.
export const dynamic = 'force-dynamic';

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
    <AppShell>
      {children}
      <ChatbotWidget />
    </AppShell>
  );
}
