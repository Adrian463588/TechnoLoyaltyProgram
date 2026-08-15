import { NextRequest, NextResponse } from "next/server";
import { getServerToken } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/backend-url";

export async function POST(req: NextRequest) {
  try {
    const token = await getServerToken();
    const formData = await req.formData();
    
    // Forward the POST request to the Express backend
    const res = await fetch(`${BACKEND_URL}/api/admin/uploads/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    // Explicitly check for successful response before parsing JSON
    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: res.status });
      } catch {
        return NextResponse.json({ error: `Backend returned ${res.status}: ${errorText}` }, { status: res.status });
      }
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Next.js Proxy Error] /api/admin/uploads/process:", error);
    return NextResponse.json(
      { error: "Failed to forward request to backend." }, 
      { status: 500 }
    );
  }
}
