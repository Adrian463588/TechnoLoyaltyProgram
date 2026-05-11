/**
 * API Tests — Redemption Status Update
 *
 * Tests PATCH /api/admin/redemptions/:id
 * Requires a running dev server + seeded DB.
 *
 * NOTE: Next.js middleware uses 307 (Temporary Redirect) for unauthenticated
 * requests. Use followRedirect: false to see the actual status.
 */

describe("API: Redemption Status Update", () => {
  // ── Without auth → 307 redirect (middleware) ──────────────
  it("redirects without authentication (307 from middleware)", () => {
    cy.clearCookies();
    cy.request({
      method:           "PATCH",
      url:              "/api/admin/redemptions/test-id",
      body:             { status: "VERIFIED" },
      headers:          { "Content-Type": "application/json" },
      failOnStatusCode: false,
      followRedirect:   false,
    }).then((resp) => {
      // Next.js middleware redirects with 307
      expect(resp.status).to.be.oneOf([302, 307, 401, 403]);
    });
  });

  // ── Invalid status enum → 400 ─────────────────────────────
  it("returns 400 for an invalid status value (even with auth)", () => {
    cy.loginAsAdmin();
    cy.request({
      method:           "PATCH",
      url:              "/api/admin/redemptions/any-id",
      body:             { status: "NOT_A_REAL_STATUS" },
      headers:          { "Content-Type": "application/json" },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(400);
      expect(resp.body).to.have.property("error");
    });
  });

  // ── Missing status → 400 ──────────────────────────────────
  it("returns 400 when status field is missing", () => {
    cy.loginAsAdmin();
    cy.request({
      method:           "PATCH",
      url:              "/api/admin/redemptions/any-id",
      body:             { reason: "Testing" },
      headers:          { "Content-Type": "application/json" },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(400);
    });
  });

  // ── Employee role → 307/403 ───────────────────────────────
  it("redirects or rejects for MITRA role (not HC_PM)", () => {
    cy.loginAsEmployee();
    cy.request({
      method:           "PATCH",
      url:              "/api/admin/redemptions/any-id",
      body:             { status: "VERIFIED" },
      headers:          { "Content-Type": "application/json" },
      failOnStatusCode: false,
      followRedirect:   false,
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([302, 307, 401, 403]);
    });
  });
});
