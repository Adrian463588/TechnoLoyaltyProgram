import { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { adminApi } from "@/lib/api-client";
import { getServerToken } from "@/lib/auth";
import MitraValidationClient from "./mitra-validation-client";
import { UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Mitra Status Validation | HC Admin",
};

export default async function MitraValidationPage(props: {
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
    console.warn("Failed to load users for validation:", error);
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
                <UserCheck className="h-6 w-6 text-[--color-accent]" />
                Mitra Status Validation
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                Verify and manage the active or resigned status of Mitras.
              </p>
            </div>
          </div>

          <div className="bento-span-12">
            <MitraValidationClient 
              users={users} 
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
