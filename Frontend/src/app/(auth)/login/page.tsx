"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Shield, Trophy, Users } from "lucide-react";

const DEMO_CREDENTIALS = [
  { label: "Employee (Mitra)", npk: "EMP001", password: "password123", icon: Trophy },
  { label: "Team Leader",      npk: "LDR001", password: "password123", icon: Users },
  { label: "HC PM Admin",      npk: "ADM001", password: "password123", icon: Shield },
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
    router.push(redirectTo);
  };

  return (
    <div className="space-y-6">
      {/* Brand header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {...register("npk")}
            />
            {errors.npk && (
              <p className="text-xs text-destructive">{errors.npk.message}</p>
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
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {errorMsg && (
            <Alert variant="destructive">
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
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
        <div className="space-y-2">
          {DEMO_CREDENTIALS.map(({ label, npk, password, icon: Icon }) => (
            <button
              key={npk}
              type="button"
              onClick={() => {
                setValue("npk", npk);
                setValue("password", password);
              }}
              className="w-full flex items-center justify-between text-left rounded-lg bg-background border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-muted-foreground">{npk}</p>
                <p className="text-xs text-muted-foreground/60">password123</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
