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
      <div className="h-16 border-b border-[var(--color-border-subtle)] bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <Breadcrumb 
          items={[
            { label: "Dashboard", href: "/employee/dashboard" },
            { label: "Team Overview" }
          ]} 
        />
      </div>
      <main className="flex-1 p-6 overflow-y-auto hide-scrollbar">
        <LeaderTeamClient data={data} />
      </main>
    </div>
  )
}
