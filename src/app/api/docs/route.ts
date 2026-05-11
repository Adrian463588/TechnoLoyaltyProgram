import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/api-docs/openapi";

/**
 * GET /api/docs
 * Returns the OpenAPI 3.1 JSON specification.
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*", // Allow Swagger UI from any origin
    },
  });
}
