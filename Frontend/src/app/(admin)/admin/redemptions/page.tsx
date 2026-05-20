import { auth, getServerToken } from "@/lib/auth";
import { adminApi } from "@/lib/api-client";
import RedemptionsClient from "./redemptions-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { CheckSquare } from "lucide-react";

export default async function RedemptionsPage() {
  await auth();
  const token = await getServerToken();

  let requests: Awaited<ReturnType<typeof adminApi.listRedemptions>> = [];
  try {
    requests = await adminApi.listRedemptions(token);
  } catch (error) {
    console.warn(
      "Failed to load redemptions:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  // Map backend DTO to the shape RedemptionsClient expects
  const mapped = requests.map((r) => ({
    id: r.id,
    userId: "",
    userName: r.item?.name ?? "—",
    rewardId: r.item?.id ?? "",
    rewardName: r.item?.name ?? "—",
    tokensSpent: r.item?.tokenCost ?? 0,
    status: r.status as import("@/types").RewardRequestStatus,
    requestedAt: r.createdAt,
    updatedAt: r.createdAt,
  }));

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
                <CheckSquare className="h-6 w-6 text-[--color-accent]" />
                Redemption Management
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                Review, verify, and process employee reward requests.
              </p>
            </div>
          </div>

          <div className="bento-span-12">
            <RedemptionsClient initialRequests={mapped} sessionToken={token} />
          </div>
        </div>
      </main>
    </div>
  );
}
