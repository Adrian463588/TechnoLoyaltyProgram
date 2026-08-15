export const dynamic = 'force-dynamic'

import { auth, getServerToken } from "@/lib/auth"
import { leaderApi } from "@/lib/api-client"
import { LeaderTeamClient } from "@/components/dashboard/leader-team-client"
import { Breadcrumb } from "@/components/shared/breadcrumb"

export default async function TeamLeaderPage() {
  await auth()
  const token = await getServerToken()
  
  const data = await leaderApi.getTeamSummary(token)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 md:px-6">
        <Breadcrumb 
          className="py-4"
        />
      </div>
      <main className="flex-1 p-4 md:p-6">
        <LeaderTeamClient data={data} totalCount={data.count} />
      </main>
    </div>
  )
}
