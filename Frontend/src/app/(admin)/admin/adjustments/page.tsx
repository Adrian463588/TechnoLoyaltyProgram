import { Breadcrumb } from "@/components/shared/breadcrumb";
import { adminApi } from "@/lib/api-client";
import { getServerToken } from "@/lib/auth";
import AdjustmentsClient from "./adjustments-client";

export default async function AdjustmentsPage() {
  const token = await getServerToken();
  const users = await adminApi.listUsers(token).catch(() => []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header */}
          <div className="bento-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Token Adjustments
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-1">
                Manually adjust tokens for Mitras and Team Leaders due to special policies or corrections.
              </p>
            </div>
          </div>

          <div className="bento-span-12">
            <AdjustmentsClient users={users} />
          </div>
        </div>
      </main>
    </div>
  );
}
