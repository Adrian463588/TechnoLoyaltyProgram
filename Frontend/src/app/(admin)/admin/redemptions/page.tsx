import { AdminService } from "@/lib/services/mockApi";
import RedemptionsClient from "./redemptions-client";

export default async function RedemptionsPage() {
  const requests = await AdminService.getAllRequests();

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Redemption Management</h1>
          <p className="text-muted-foreground mt-1">Review, verify, and process employee reward requests.</p>
        </div>
      </div>
      
      <RedemptionsClient initialRequests={requests} />
    </div>
  );
}
