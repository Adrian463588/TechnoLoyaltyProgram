import { auth, getServerToken } from "@/lib/auth";
import { adminApi } from "@/lib/api-client";
import RedemptionsClient from "./redemptions-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";

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

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Redemption Management
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-1">
                Review, verify, and process employee reward requests.
              </p>
            </div>
          </div>

          <RedemptionsClient initialRequests={mapped} sessionToken={token} />
        </div>
      </main>
    </div>
  );
}
