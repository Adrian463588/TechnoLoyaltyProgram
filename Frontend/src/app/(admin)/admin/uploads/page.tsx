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
    <div className="max-w-[1600px] mx-auto w-full space-y-8 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-section-title">Monthly Uploads</h1>
        <p className="text-body max-w-2xl">Upload and validate Optel & Techno point distributions.</p>
      </div>

      <UploadsClient history={uploads} />
    </div>
  );
}
