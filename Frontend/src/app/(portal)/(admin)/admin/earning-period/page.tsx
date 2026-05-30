export const dynamic = 'force-dynamic'

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
          <div className="bento-span-12 bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
                <CalendarClock size={28} />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                  System Configuration
                </h1>
                <p className="text-sm text-[--color-text-secondary]">
                  Manage annual loyalty cycles, redemption windows, and fulfillment logistics.
                </p>
              </div>
            </div>
          </div>

          <EarningPeriodClient initialSettings={settings} sessionToken={token} />
        </div>
      </main>
    </div>
  );
}
