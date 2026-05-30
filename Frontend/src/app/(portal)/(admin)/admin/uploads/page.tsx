export const dynamic = 'force-dynamic'

import UploadsClient from "./uploads-client";
import { adminApi } from "@/lib/api-client";
import { getServerToken } from "@/lib/auth";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FileUp } from "lucide-react";

export default async function UploadsPage() {
  const token = await getServerToken();
  const uploads = await adminApi.listUploads(token).then((items) =>
    items.map((item) => ({
      id: item.id,
      filename: item.filename,
      status: item.status === "FAILED" ? "Failed" as const : item.status === "COMPLETED" ? "Completed" as const : "Processing" as const,
      uploadedAt: item.createdAt,
      validRows: item.validRows,
      errorRows: item.errorRows,
      issues: [],
    })),
  ).catch(() => []);

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
                <FileUp size={28} />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                  Monthly Uploads
                </h1>
                <p className="text-sm text-[--color-text-secondary]">
                  Upload and validate Optel & Techno point distributions.
                </p>
              </div>
            </div>
          </div>

          <div className="bento-span-12">
            <UploadsClient history={uploads} />
          </div>
        </div>
      </main>
    </div>
  );
}
