import { auth } from "@/lib/auth";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProfileClient } from "./profile-client";
import { UserCog } from "lucide-react";

export async function ProfilePageContent() {
  const session = await auth();
  const user = session?.user;

  const token = (session as { accessToken?: string; user?: { accessToken?: string } })?.accessToken || 
                (session as { accessToken?: string; user?: { accessToken?: string } })?.user?.accessToken || "";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Page Header Card */}
        <div className="bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
              <UserCog size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                Account Settings
              </h1>
              <p className="text-sm text-[--color-text-secondary]">
                Manage your personal presence and account security.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="animate-fade-up-in stagger-1">
          <ProfileClient user={user} accessToken={token} />
        </div>
      </main>
    </div>
  );
}
