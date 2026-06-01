export const dynamic = 'force-dynamic';

import { ProfilePageContent } from "@/features/profile/profile-page-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leader Profile | Berijalan Loyalty",
};

export default function LeaderProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <ProfilePageContent />
    </div>
  );
}
