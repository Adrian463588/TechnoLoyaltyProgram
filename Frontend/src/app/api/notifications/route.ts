import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend-url";
import { getServerToken } from "@/lib/auth";

export async function GET() {
  const token = await getServerToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${BACKEND_URL}/api/employee/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to load notifications" }, { status: response.status });
  }

  return NextResponse.json(await response.json());
}
