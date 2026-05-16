const BACKEND_URL = process.env["NEXT_PUBLIC_BACKEND_URL"] ?? process.env["BACKEND_URL"] ?? "http://localhost:8080";

export async function checkBackendHealth(): Promise<boolean> {
  if (process.env.NODE_ENV === "production") return true;
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function validateEnvMatch(): string | null {
  const fe = process.env["NEXTAUTH_SECRET"];
  if (!fe) return "NEXTAUTH_SECRET not set in frontend .env.local";
  if (fe.length < 32) return "NEXTAUTH_SECRET must be at least 32 characters";
  return null;
}