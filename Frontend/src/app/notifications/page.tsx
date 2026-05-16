/**
 * /notifications — Empty-state notifications page.
 * Available to all authenticated roles via root layout.
 * Phase 1: stub with empty state. Bell → here.
 */
import { Bell } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";

export const metadata = { title: "Notifications | Berijalan Loyalty" };

export default function NotificationsPage() {
  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Notifications
        </h1>
        <p className="text-muted-foreground mt-1">
          System alerts and updates will appear here.
        </p>
      </div>

      <BentoCard className="p-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="p-4 bg-muted rounded-full">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">All caught up</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You have no new notifications at this time.
          </p>
        </div>
      </BentoCard>
    </div>
  );
}
