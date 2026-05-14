import { auth, getServerToken } from "@/lib/auth"
import { employeeApi } from "@/lib/api-client"
import { EmployeeDashboardClient } from "@/components/dashboard/employee-dashboard-client"

export default async function EmployeeDashboardPage() {
  await auth()
  const token = await getServerToken()
  
  let data = null
  try {
    data = await employeeApi.getDashboard(token)
  } catch (error) {
    console.warn("Failed to fetch employee dashboard data. Using fallback:", error instanceof Error ? error.message : "Unknown error")
  }

  return <EmployeeDashboardClient data={data} />
}
