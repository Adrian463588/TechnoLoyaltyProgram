import { checkBackendHealth, validateEnvMatch } from "@/lib/services/backend-health";

export default async function StartupCheck() {
  if (process.env.NODE_ENV === "production") return null;

  const envWarning = validateEnvMatch();
  if (envWarning) {
    console.warn(`[StartupCheck] ${envWarning}`);
  }

  const backendUp = await checkBackendHealth();
  if (!backendUp) {
    console.warn(
      `[StartupCheck] Backend unreachable at ${process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8080"}. ` +
      `Ensure Backend is running: npm run dev:backend`
    );
  }

  return null;
}