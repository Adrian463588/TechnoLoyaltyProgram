import UploadsClient from "./uploads-client";
import { adminApi } from "@/lib/api-client";
import { getServerToken } from "@/lib/auth";
import { Breadcrumb } from "@/components/shared/breadcrumb";

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

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-section-title text-[var(--color-text-primary)]">Monthly Uploads</h1>
            <p className="text-[var(--color-text-secondary)] max-w-2xl">Upload and validate Optel & Techno point distributions.</p>
          </div>

          <UploadsClient history={uploads} />
        </div>
      </main>
    </div>
  );
}
