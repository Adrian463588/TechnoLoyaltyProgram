import { NextResponse } from "next/server";

const SWAGGER_UI_VERSION = "5.17.14";
const SPEC_URL = "/api/docs";

/**
 * GET /api/docs/swagger-ui
 * Serves the Swagger UI HTML page, loading the spec from /api/docs.
 * Uses the official Swagger UI CDN bundle — no npm package required.
 */
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Berijalan Loyalty Portal — API Docs</title>
  <meta name="description" content="Interactive API documentation for the Berijalan Employee Loyalty Portal." />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css" />
  <style>
    *  { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
    }
    /* Branded header bar */
    .api-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-bottom: 2px solid #7CC446;
      padding: 16px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .api-header h1 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .api-header .badge {
      background: #7CC446;
      color: #0f172a;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      letter-spacing: 0.05em;
    }
    /* Override Swagger UI background */
    #swagger-ui {
      background: #fff;
    }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #1e293b; }
  </style>
</head>
<body>
  <div class="api-header">
    <h1>🚀 Berijalan Loyalty Portal</h1>
    <span class="badge">API v1.0</span>
  </div>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${SPEC_URL}",
        dom_id: "#swagger-ui",
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset,
        ],
        plugins: [ SwaggerUIBundle.plugins.DownloadUrl ],
        layout: "StandaloneLayout",
        deepLinking: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        filter: true,
        withCredentials: true,  // Send cookies with Try-It-Out requests
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
