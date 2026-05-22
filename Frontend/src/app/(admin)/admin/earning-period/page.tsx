import { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { adminApi } from "@/lib/api-client";
import { getServerToken } from "@/lib/auth";
import { EarningPeriodClient } from "./earning-period-client";
import { CalendarClock } from "lucide-react";

export const metadata: Metadata = {
  title: "Earning Period Settings | HC Admin",
};

export default async function EarningPeriodPage() {
  const token = await getServerToken();
  let settings = null;

  try {
    settings = await adminApi.getSystemSettings(token);
  } catch (error) {
    console.warn("Failed to load system settings:", error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header Card */}
          <div className="bento-span-12 bento-card p-6 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div>
              <h1 className="text-card-heading text-2xl mb-1 flex items-center gap-3">
                <CalendarClock className="h-6 w-6 text-[--color-accent]" />
                System Configuration
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                Manage annual loyalty cycles, redemption windows, and fulfillment logistics.
              </p>
            </div>
          </div>

          <EarningPeriodClient initialSettings={settings} sessionToken={token} />
        </div>
      </main>
    </div>
  );
}
