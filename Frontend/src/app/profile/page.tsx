/**
 * /profile — User profile stub page.
 * Phase 1: display session info only. Edit form deferred.
 */
import { auth } from "@/lib/auth";
import { User, Mail, Shield } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Profile | Berijalan Loyalty" };

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  
  const token = (session as { accessToken?: string; user?: { accessToken?: string } })?.accessToken || 
                (session as { accessToken?: string; user?: { accessToken?: string } })?.user?.accessToken || "";

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Your account information.
        </p>
      </div>

      <BentoCard className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">
              {user?.name ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {(user as { role?: string })?.role ?? "MITRA"}
            </p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-border">
          <div className="flex items-center gap-3 pt-4">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium text-foreground">
                {(user as { role?: string })?.role ?? "MITRA"}
              </p>
            </div>
          </div>
        </div>
        
        <ChangePasswordForm accessToken={token} />
      </BentoCard>
    </div>
  );
}
