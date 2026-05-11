/**
 * OpenAPI 3.1 Specification
 * Berijalan Employee Loyalty Portal — Backend API
 *
 * Served at:
 *   GET /api/docs         → JSON spec
 *   GET /api/docs/swagger-ui → HTML Swagger UI
 */

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Berijalan Loyalty Portal API",
    version: "1.0.0",
    description:
      "Internal API for the Berijalan Employee Loyalty Program Portal. Handles authentication, loyalty data, redemptions, and admin workflows.",
    contact: { name: "Berijalan HC PM Team" },
  },
  servers: [
    { url: "http://localhost:3000", description: "Local Development" },
  ],

  // ── Security Schemes ────────────────────────────────────────
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description:
          "HTTP-only session cookie set by NextAuth after successful login. Include automatically via browser or by copying the cookie header.",
      },
    },
    schemas: {
      // ── Error ──────────────────────────────────────────────
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error:   { type: "string", example: "Unauthorized" },
          message: { type: "string", example: "Authentication required." },
        },
      },

      // ── Auth ───────────────────────────────────────────────
      LoginRequest: {
        type: "object",
        required: ["npk", "password"],
        properties: {
          npk:      { type: "string", minLength: 3, example: "EMP001" },
          password: { type: "string", minLength: 6, example: "secret123" },
        },
      },
      SessionUser: {
        type: "object",
        properties: {
          id:         { type: "string" },
          npk:        { type: "string" },
          name:       { type: "string" },
          email:      { type: "string", format: "email" },
          role:       { type: "string", enum: ["MITRA", "TEAM_LEADER", "HC_PM"] },
          divisionId: { type: "string", nullable: true },
        },
      },

      // ── Redemption ─────────────────────────────────────────
      RedemptionStatus: {
        type: "string",
        enum: [
          "DRAFT",
          "PENDING_VERIFICATION",
          "VERIFIED",
          "REJECTED",
          "PURCHASED",
          "PICKUP_SCHEDULED",
          "COMPLETED",
          "CANCELLED",
        ],
      },
      UpdateRedemptionStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { $ref: "#/components/schemas/RedemptionStatus" },
          reason: { type: "string", nullable: true, example: "Item out of stock" },
        },
      },
      RedemptionResponse: {
        type: "object",
        properties: {
          id:          { type: "string" },
          status:      { $ref: "#/components/schemas/RedemptionStatus" },
          updatedAt:   { type: "string", format: "date-time" },
          verifiedById:{ type: "string", nullable: true },
        },
      },

      // ── Upload ─────────────────────────────────────────────
      UploadIssue: {
        type: "object",
        properties: {
          rowNumber: { type: "integer" },
          column:    { type: "string" },
          issue:     { type: "string" },
          severity:  { type: "string", enum: ["WARNING", "ERROR"] },
        },
      },
      UploadSummary: {
        type: "object",
        properties: {
          totalRows:   { type: "integer" },
          validRows:   { type: "integer" },
          errorRows:   { type: "integer" },
          warningRows: { type: "integer" },
          hasErrors:   { type: "boolean" },
          canCommit:   { type: "boolean" },
        },
      },
      UploadResponse: {
        type: "object",
        properties: {
          division: { type: "string", enum: ["OPTEL", "TECHNO"] },
          rows:     { type: "array", items: { type: "object" } },
          issues:   { type: "array", items: { $ref: "#/components/schemas/UploadIssue" } },
          summary:  { $ref: "#/components/schemas/UploadSummary" },
        },
      },

      // ── Audit Log ──────────────────────────────────────────
      AuditLogEntry: {
        type: "object",
        properties: {
          id:         { type: "string" },
          action:     { type: "string" },
          actorId:    { type: "string" },
          targetType: { type: "string", nullable: true },
          targetId:   { type: "string", nullable: true },
          details:    { type: "object", nullable: true },
          ipAddress:  { type: "string", nullable: true },
          createdAt:  { type: "string", format: "date-time" },
        },
      },
    },
  },

  // ── Global Security ─────────────────────────────────────────
  security: [{ cookieAuth: [] }],

  // ── Paths ───────────────────────────────────────────────────
  paths: {
    // ── Auth ─────────────────────────────────────────────────
    "/api/auth/session": {
      get: {
        tags: ["Authentication"],
        summary: "Get current session",
        description: "Returns the current user session. Returns an empty object if not authenticated.",
        security: [],
        responses: {
          "200": {
            description: "Session data (may have empty user if unauthenticated)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/SessionUser" } },
                },
              },
            },
          },
        },
      },
    },

    "/api/auth/signin": {
      post: {
        tags: ["Authentication"],
        summary: "Sign in with NPK credentials",
        description:
          "Authenticates with NPK and password. On success, sets an HTTP-only session cookie.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: { npk: "EMP001", password: "secret123" },
            },
          },
        },
        responses: {
          "200": { description: "Authentication successful. Session cookie set." },
          "401": {
            description: "Invalid credentials",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/auth/signout": {
      post: {
        tags: ["Authentication"],
        summary: "Sign out",
        description: "Clears the session cookie and ends the authenticated session.",
        responses: {
          "200": { description: "Signed out successfully" },
        },
      },
    },

    // ── Redemptions ───────────────────────────────────────────
    "/api/admin/redemptions/{id}": {
      patch: {
        tags: ["Admin — Redemptions"],
        summary: "Update redemption request status",
        description:
          "Updates the status of a reward redemption request. Requires HC_PM role. Logs the transition to status history.",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Redemption request CUID",
            example: "clxabcdef1234",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateRedemptionStatusRequest" },
              examples: {
                verify: { summary: "Verify request", value: { status: "VERIFIED" } },
                reject: { summary: "Reject with reason", value: { status: "REJECTED", reason: "Out of stock" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Status updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RedemptionResponse" } },
            },
          },
          "400": {
            description: "Invalid input (status not in enum, missing field, etc.)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient role (requires HC_PM)" },
          "500": { description: "Internal server error" },
        },
      },
    },

    // ── Uploads ───────────────────────────────────────────────
    "/api/admin/uploads/process": {
      post: {
        tags: ["Admin — Uploads"],
        summary: "Process monthly upload file",
        description:
          "Accepts an .xlsx or .csv loyalty data file, parses it, validates all rows, and returns a summary. Auto-detects division from XLSX headers if not specified.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file:     { type: "string", format: "binary", description: "XLSX or CSV file" },
                  division: { type: "string", enum: ["OPTEL", "TECHNO"], description: "Required for CSV; auto-detected for XLSX" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "File parsed. Review summary before committing.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UploadResponse" } } },
          },
          "400": { description: "Missing file or unknown division" },
          "401": { description: "Not authenticated" },
          "403": { description: "Requires HC_PM role" },
          "415": { description: "Unsupported file format" },
        },
      },
    },

    // ── Audit Log ─────────────────────────────────────────────
    "/api/admin/audit": {
      get: {
        tags: ["Admin — Audit"],
        summary: "Retrieve audit log entries",
        description: "Returns a paginated list of audit log entries for admin actions. Requires HC_PM role.",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "page",     in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          { name: "action",   in: "query", schema: { type: "string" }, description: "Filter by action name" },
        ],
        responses: {
          "200": {
            description: "Audit log entries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    logs:  { type: "array", items: { $ref: "#/components/schemas/AuditLogEntry" } },
                    total: { type: "integer" },
                    page:  { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Requires HC_PM role" },
        },
      },
    },
  },
} as const;
