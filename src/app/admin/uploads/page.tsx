import { AdminService } from "@/lib/services/mockApi";
import UploadsClient from "./uploads-client";

export default async function UploadsPage() {
  const uploads = await AdminService.getUploads();

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
