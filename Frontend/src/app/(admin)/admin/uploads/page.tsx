import UploadsClient from "./uploads-client";
import { adminApi } from "@/lib/api-client";
import { getServerToken } from "@/lib/auth";

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
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Monthly Uploads</h1>
          <p className="text-muted-foreground mt-1">Upload and validate Optel & Techno point distributions.</p>
        </div>
      </div>

      <UploadsClient history={uploads} />
    </div>
  );
}
