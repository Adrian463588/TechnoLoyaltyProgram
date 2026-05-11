/**
 * API Tests — File Upload Processing
 *
 * Tests POST /api/admin/uploads via cy.request().
 *
 * NOTE: Next.js middleware uses 307 (Temporary Redirect) for unauthenticated
 * requests to /api/admin/*. Use followRedirect: false to see the actual status.
 *
 * NOTE: Full CSV file upload via the UI is covered in admin.cy.ts (E2E).
 * This spec focuses on auth guards and request-level validation.
 */

describe("API: Upload Processing", () => {
  // ── Without auth → 307 redirect (middleware) ──────────────
  it("redirects when called without authentication (307 from middleware)", () => {
    cy.clearCookies();
    cy.request({
      method:           "POST",
      url:              "/api/admin/uploads",
      failOnStatusCode: false,
      followRedirect:   false,
    }).then((resp) => {
      // Next.js middleware redirects unauthenticated API routes with 307
      expect(resp.status).to.be.oneOf([302, 307, 401, 403]);
    });
  });

  // ── No file attached (JSON body) → 400/500 ───────────────
  it("returns 400 or 500 when no file is attached (auth valid)", () => {
    cy.loginAsAdmin();
    cy.request({
      method:           "POST",
      url:              "/api/admin/uploads",
      headers:          { "Content-Type": "application/json" },
      body:             { division: "OPTEL" },
      failOnStatusCode: false,
    }).then((resp) => {
      // 400 = no file, 500 = formData parse error on JSON Content-Type
      expect(resp.status).to.be.oneOf([400, 415, 500]);
    });
  });

  // ── Employee role → 307 redirect ─────────────────────────
  it("redirects for MITRA role (not HC_PM) — middleware enforces role", () => {
    cy.loginAsEmployee();
    cy.request({
      method:           "POST",
      url:              "/api/admin/uploads",
      failOnStatusCode: false,
      followRedirect:   false,
    }).then((resp) => {
      // Middleware redirects non-HC_PM authenticated users away from /api/admin
      expect(resp.status).to.be.oneOf([302, 307, 401, 403]);
    });
  });
});
