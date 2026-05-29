/**
 * Frontend/src/app/api/admin/uploads/commit/route.ts
 *
 * Next.js proxy route — forwards the commit payload to the Express backend.
 * Previously, the commit was a fake setTimeout simulation in the UI.
 * This route replaces that with a real backend call.
 *
 * HC_PM role enforcement is done at:
 *   1. Edge middleware (proxy.ts) — blocks non-HC_PM from /api/admin/*
 *   2. Backend authorize("HC_PM") middleware on /api/admin/uploads/commit
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = await getServerToken();
    const body: unknown = await req.json();

    const backendUrl =
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      "http://localhost:8080";

    const res = await fetch(`${backendUrl}/api/admin/uploads/commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText) as unknown;
        return NextResponse.json(errorJson, { status: res.status });
      } catch {
        return NextResponse.json(
          { error: `Backend returned ${res.status}: ${errorText}` },
          { status: res.status },
        );
      }
    }

    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Next.js Proxy Error] /api/admin/uploads/commit:", error);
    return NextResponse.json(
      { error: "Failed to forward commit request to backend." },
      { status: 500 },
    );
  }
}
