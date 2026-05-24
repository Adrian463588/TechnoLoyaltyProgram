"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { employeeApi } from "@/lib/api-client";

interface ChangePasswordFormProps {
  accessToken: string;
}

export function ChangePasswordForm({ accessToken }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      if (!accessToken) throw new Error("No authorization token found");
      
      await employeeApi.changePassword(accessToken, {
        currentPassword,
        newPassword
      });
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <Input 
          id="current-password" 
          type="password" 
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          placeholder="Enter your current password"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input 
          id="new-password" 
          type="password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          placeholder="Must be at least 8 characters"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input 
          id="confirm-password" 
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Re-enter your new password"
        />
      </div>
      
      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
