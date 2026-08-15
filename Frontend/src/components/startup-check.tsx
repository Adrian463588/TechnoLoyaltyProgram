import { checkBackendHealth, validateEnvMatch } from "@/lib/services/backend-health";
import { PUBLIC_BACKEND_URL } from "@/lib/backend-url";

export default async function StartupCheck() {
  if (process.env.NODE_ENV === "production") return null;

  const envWarning = validateEnvMatch();
  const backendUp = await checkBackendHealth();

  if (!envWarning && backendUp) return null;

  const message = envWarning ??
    `Backend is unreachable at ${PUBLIC_BACKEND_URL}. Start it with npm run dev:backend.`;

  return (
    <aside
      role="alert"
      data-testid="startup-error"
      className="fixed inset-x-4 bottom-4 z-[100] rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-lg md:inset-x-auto md:right-4 md:max-w-md"
    >
      <p className="font-semibold">Local development services are unavailable</p>
      <p className="mt-1">{message}</p>
    </aside>
  );
}
