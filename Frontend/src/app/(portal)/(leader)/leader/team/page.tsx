import { auth, getServerToken } from "@/lib/auth"
import { leaderApi } from "@/lib/api-client"
import { LeaderTeamClient } from "@/components/dashboard/leader-team-client"
import { Breadcrumb } from "@/components/shared/breadcrumb"

export default async function TeamLeaderPage() {
  await auth()
  const token = await getServerToken()
  
  let data = null
  try {
    data = await leaderApi.getTeamSummary(token)
  } catch (error) {
    console.warn("Failed to fetch leader team data. Using fallback:", error instanceof Error ? error.message : "Unknown error")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 md:px-6">
        <Breadcrumb 
          className="py-4"
          items={[
            { label: "Dashboard", href: "/employee/dashboard" },
            { label: "Team Overview" }
          ]} 
        />
      </div>
      <main className="flex-1 p-4 md:p-6">
        <LeaderTeamClient data={data} />
      </main>
    </div>
  )
}
