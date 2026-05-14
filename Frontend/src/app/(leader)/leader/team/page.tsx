import { auth, getServerToken } from "@/lib/auth"
import { leaderApi } from "@/lib/api-client"
import { LeaderTeamClient } from "@/components/dashboard/leader-team-client"

export default async function TeamLeaderPage() {
  await auth()
  const token = await getServerToken()
  
  let data = null
  try {
    data = await leaderApi.getTeamSummary(token)
  } catch (error) {
    console.warn("Failed to fetch leader team data. Using fallback:", error instanceof Error ? error.message : "Unknown error")
  }

  return <LeaderTeamClient data={data} />
}
