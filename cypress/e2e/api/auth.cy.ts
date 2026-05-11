/**
 * API Tests — Authentication Endpoints
 *
 * Tests the /api/auth/* routes directly without UI interaction.
 *
 * NOTE on redirects: Next.js middleware uses HTTP 307 (Temporary Redirect)
 * when redirecting unauthenticated requests to /login — not 302.
 * Use followRedirect: false to see the actual status.
 */

describe("API: Authentication", () => {
  // ── Session endpoint ────────────────────────────────────────
  it("GET /api/auth/session returns empty session when unauthenticated", () => {
    cy.clearCookies();
    cy.request({
      url:              "/api/auth/session",
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      // NextAuth v5 returns {} or null when unauthenticated — no user property
      const body = resp.body as Record<string, unknown> | null;
      const hasUser = body != null && body.user != null;
      expect(hasUser).to.eq(false);
    });
  });

  // ── Protected admin API — no auth → 307 redirect ───────────
  it("PATCH /api/admin/redemptions/:id redirects without auth (307)", () => {
    cy.clearCookies();
    cy.request({
      method:           "PATCH",
      url:              "/api/admin/redemptions/nonexistent-id",
      body:             { status: "VERIFIED" },
      headers:          { "Content-Type": "application/json" },
      failOnStatusCode: false,
      followRedirect:   false,
    }).then((resp) => {
      // Next.js middleware uses 307 (Temporary Redirect) to /login
      expect(resp.status).to.be.oneOf([302, 307, 401, 403]);
    });
  });

  // ── Protected upload API — no auth → 307 redirect ──────────
  it("POST /api/admin/uploads redirects without auth (307)", () => {
    cy.clearCookies();
    cy.request({
      method:           "POST",
      url:              "/api/admin/uploads",
      body:             {},
      failOnStatusCode: false,
      followRedirect:   false,
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([302, 307, 401, 403]);
    });
  });

  // ── CSRF token endpoint reachable ──────────────────────────
  it("GET /api/auth/csrf returns a CSRF token", () => {
    cy.request({
      url:              "/api/auth/csrf",
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body).to.have.property("csrfToken");
    });
  });

  // ── Providers list ──────────────────────────────────────────
  it("GET /api/auth/providers lists credentials provider", () => {
    cy.request({
      url:              "/api/auth/providers",
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body).to.have.property("credentials");
    });
  });
});
