import { ProfilePageContent } from "@/features/profile/profile-page-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Profile | Berijalan Loyalty",
};

export default function AdminProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <ProfilePageContent />
    </div>
  );
}
