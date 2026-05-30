"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Shield, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import { DemoAccountDock } from "@/components/auth/demo-account-dock";

const ROLE_REDIRECT: Record<string, string> = {
  MITRA:       "/employee/dashboard",
  TEAM_LEADER: "/leader/dashboard",
  HC_PM:       "/admin/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    const result = await signIn("credentials", {
      npk: data.npk,
      password: data.password,
      redirect: false,
    });

    if (!result || result.error) {
      setErrorMsg("Invalid NPK or password. Please check your credentials.");
      setIsLoading(false);
      return;
    }

    // Fetch session to get role for redirect
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role as string | undefined;
    const redirectTo = role ? (ROLE_REDIRECT[role] ?? "/employee/dashboard") : "/employee/dashboard";
    router.push(redirectTo as Route);
  };

  return (
    <div className="space-y-6">
      {/* Brand header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Image
            src="/LoyaltyProgram_Icon.png"
            alt="Loyalty Program Icon"
            width={120}
            height={120}
            priority
            className="object-contain"
          />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            <span className="text-primary">Beri</span>jalan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Employee Loyalty Program Portal</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Sign In</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter your NPK and password to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="npk" className="text-sm font-medium">
              NPK (Employee ID)
            </Label>
            <Input
              id="npk"
              type="text"
              placeholder="e.g. EMP001"
              autoComplete="username"
              className="bg-muted/30"
              data-testid="login-npk"
              aria-describedby={errors.npk ? "npk-error" : undefined}
              aria-invalid={!!errors.npk}
              {...register("npk")}
            />
            {errors.npk && (
              <p id="npk-error" role="alert" className="text-xs text-destructive">
                {errors.npk.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="bg-muted/30"
              data-testid="login-password"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {errorMsg && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
            data-testid="login-submit"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Floating Demo Account Selector */}
      <DemoAccountDock 
        onSelect={(npk, pass) => {
          setValue("npk", npk);
          setValue("password", pass);
        }} 
      />
    </div>
  );
}
