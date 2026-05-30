export const dynamic = 'force-dynamic'

import { auth, getServerToken } from "@/lib/auth";
import { adminApi } from "@/lib/api-client";
import RedemptionsClient from "./redemptions-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { CheckSquare } from "lucide-react";

export default async function RedemptionsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  await auth();
  const token = await getServerToken();
  const searchParams = await props.searchParams;

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  let requests: import("@/lib/api-client").RedemptionResponse[] = [];
  let totalCount = 0;
  try {
    const res = await adminApi.listRedemptions(token, { limit: itemsPerPage, offset });
    requests = res.requests;
    totalCount = res.total;
  } catch (error) {
    console.warn(
      "Failed to load redemptions:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Map backend DTO to the shape RedemptionsClient expects
  const mapped = requests.map((r) => ({
    id: r.id,
    userId: r.mitra?.id ?? "",
    userNpk: r.mitra?.npk ?? "—",
    userName: r.mitra?.name ?? "—",
    userDocuments: r.mitra?.documents ?? [],
    rewardId: r.item?.id ?? "",
    rewardName: r.item?.name ?? "—",
    tokensSpent: r.item?.tokenCost ?? 0,
    status: r.status as import("@/types").RewardRequestStatus,
    isRepresented: (r as any).isRepresented ?? false,
    powerOfAttorneyUrl: (r as any).powerOfAttorneyUrl ?? null,
    rejectReason: r.rejectReason ?? undefined,
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
          <div className="bento-span-12 bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
                <CheckSquare size={28} />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                  Redemption Management
                </h1>
                <p className="text-sm text-[--color-text-secondary]">
                  Review, verify, and process employee reward requests.
                </p>
              </div>
            </div>
          </div>

          <div className="bento-span-12">
            <RedemptionsClient 
              initialRequests={mapped} 
              sessionToken={token} 
              totalCount={totalCount}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
