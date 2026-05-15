import { getPendingConfirmations } from "@/features/leader/actions";
import { LeaderAlertsClient } from "./alerts-client";

/**
 * LeaderAlertsPage — TL-01 (Server Component)
 *
 * Fetches real pending partner confirmations from the backend.
 * Passes them to the client component for interactive confirm/decline.
 */
export default async function LeaderAlertsPage() {
  const confirmations = await getPendingConfirmations();

  return <LeaderAlertsClient confirmations={confirmations} />;
}
