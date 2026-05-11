/**
 * Cypress Custom Commands
 *
 * cy.login(npk, password) — uses cy.session() to cache auth state via real login page
 * cy.loginAsAdmin()       — HC_PM seed user shorthand  (ADM001 / password123)
 * cy.loginAsEmployee()    — MITRA seed user shorthand  (EMP001 / password123)
 * cy.loginAsLeader()      — TEAM_LEADER shorthand      (LDR001 / password123)
 */

/// <reference types="cypress" />

// ── Type declarations ─────────────────────────────────────────
declare global {
  namespace Cypress {
    interface Chainable {
      login(npk: string, password: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginAsEmployee(): Chainable<void>;
      loginAsLeader(): Chainable<void>;
    }
  }
}

// ── Login command ─────────────────────────────────────────────
// Uses cy.session() so the auth cookie is cached between tests.
Cypress.Commands.add("login", (npk: string, password: string) => {
  cy.session(
    ["login", npk],
    () => {
      cy.visit("/login");
      // Wait for the form to mount
      cy.get("[data-testid=login-npk]", { timeout: 8000 }).should("be.visible");
      cy.get("[data-testid=login-npk]").clear().type(npk);
      cy.get("[data-testid=login-password]").clear().type(password);
      cy.get("[data-testid=login-submit]").click();
      // Redirect away from /login means success
      cy.url({ timeout: 15000 }).should("not.include", "/login");
    },
    {
      // Validate that the session cookie is still alive on restore
      validate() {
        cy.request({ url: "/api/auth/session", failOnStatusCode: false }).then(
          (resp) => {
            expect(resp.status).to.eq(200);
            expect(resp.body).to.have.property("user");
          }
        );
      },
    }
  );
});

Cypress.Commands.add("loginAsAdmin", () => {
  cy.login(
    Cypress.env("ADMIN_NPK")      ?? "ADM001",
    Cypress.env("ADMIN_PASSWORD") ?? "password123"
  );
});

Cypress.Commands.add("loginAsEmployee", () => {
  cy.login(
    Cypress.env("EMPLOYEE_NPK")      ?? "EMP001",
    Cypress.env("EMPLOYEE_PASSWORD") ?? "password123"
  );
});

Cypress.Commands.add("loginAsLeader", () => {
  cy.login(
    Cypress.env("LEADER_NPK")      ?? "LDR001",
    Cypress.env("LEADER_PASSWORD") ?? "password123"
  );
});

export {};
