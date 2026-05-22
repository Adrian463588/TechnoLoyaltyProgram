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

const DEMO_CREDENTIALS = [
  { label: "Admin (HC PM)", npk: "12345", password: "password123", icon: Shield },
  { label: "Leader (OpCent)", npk: "23456", password: "password123", icon: Users },
  { label: "Leader (Tele)", npk: "23457", password: "password123", icon: Users },
  { label: "Leader (Techno)", npk: "23458", password: "password123", icon: Users },
  { label: "Alice (OpCent, Emerald)", npk: "34567", password: "password123", icon: Trophy },
  { label: "Saphire (Tele, Saphire)", npk: "40001", password: "password123", icon: Trophy },
  { label: "Emerald (OpCent, Emerald)", npk: "40002", password: "password123", icon: Trophy },
  { label: "Ruby (Techno, Ruby)", npk: "40003", password: "password123", icon: Trophy },
  { label: "Diamond (Techno, Diamond)", npk: "40004", password: "password123", icon: Trophy },
  { label: "Eve (OpCent, Inactive)", npk: "40005", password: "password123", icon: Trophy },
  { label: "Frank (Tele, Resigned)", npk: "40006", password: "password123", icon: Trophy },
];

const ROLE_REDIRECT: Record<string, string> = {
  MITRA:       "/employee/dashboard",
  TEAM_LEADER: "/leader/team",
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

      {/* Demo accounts */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
          Demo Accounts
        </p>
        <div className="space-y-2" role="list" aria-label="Demo account credentials">
          {DEMO_CREDENTIALS.map(({ label, npk, password, icon: Icon }) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              key={npk}
              type="button"
              role="listitem"
              aria-label={`Fill credentials for ${label}`}
              onClick={() => {
                setValue("npk", npk);
                setValue("password", password);
              }}
              className="w-full flex items-center justify-between text-left rounded-lg bg-background border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-primary/10" aria-hidden="true">
                  <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <div className="text-right" aria-hidden="true">
                <p className="text-xs font-mono text-muted-foreground">{npk}</p>
                <p className="text-xs text-muted-foreground/60">password123</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
