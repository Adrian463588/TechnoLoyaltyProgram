export const dynamic = 'force-dynamic'

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { adminApi } from "@/lib/api-client";
import { getServerToken } from "@/lib/auth";
import AdjustmentsClient from "./adjustments-client";
import { Zap } from "lucide-react";

export default async function AdjustmentsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const token = await getServerToken();
  const searchParams = await props.searchParams;

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  let users: import("@/lib/api-client").UserResponse[] = [];
  let totalCount = 0;
  try {
    const res = await adminApi.listUsers(token, { limit: itemsPerPage, offset });
    users = res.users;
    totalCount = res.total;
  } catch (error) {
    console.warn("Failed to load users for adjustments:", error);
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header */}
          <div className="bento-span-12 bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
                <Zap size={28} />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                  Token Adjustments
                </h1>
                <p className="text-sm text-[--color-text-secondary]">
                  Manually adjust tokens for Mitras due to special policies or corrections.
                </p>
              </div>
            </div>
          </div>

          <div className="bento-span-12">
            <AdjustmentsClient 
              users={users} 
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
