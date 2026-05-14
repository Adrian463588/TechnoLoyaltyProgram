/**
 * TestSuite/cypress/support/commands.ts
 * Cypress Custom Commands
 *
 * cy.login(npk, password) — caches auth state via cy.session()
 * cy.loginAsAdmin()       — HC_ADMIN seed user   (12345 / password123)
 * cy.loginAsEmployee()    — MITRA seed user      (34567 / password123)
 * cy.loginAsLeader()      — TEAM_LEAD seed user   (23456 / password123)
 */

/// <reference types="cypress" />

// ── Type declarations ─────────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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
Cypress.Commands.add("login", (npk: string, password: string) => {
  cy.session(
    ["login", npk],
    () => {
      cy.visit("/login");
      cy.get("[data-testid=login-npk]", { timeout: 8000 }).should("be.visible");
      cy.get("[data-testid=login-npk]").clear();
      cy.get("[data-testid=login-npk]").type(npk);
      cy.get("[data-testid=login-password]").clear();
      cy.get("[data-testid=login-password]").type(password);
      cy.get("[data-testid=login-submit]").click();
      cy.url({ timeout: 15_000 }).should("not.include", "/login");
    },
    {
      validate() {
        cy.request({ url: "/api/auth/session", failOnStatusCode: false }).then((resp) => {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.have.property("user");
        });
      },
    }
  );
});

Cypress.Commands.add("loginAsAdmin", () => {
  cy.login(
    Cypress.env("ADMIN_NPK")      ?? "12345",
    Cypress.env("ADMIN_PASSWORD") ?? "password123"
  );
});

Cypress.Commands.add("loginAsEmployee", () => {
  cy.login(
    Cypress.env("EMPLOYEE_NPK")      ?? "34567",
    Cypress.env("EMPLOYEE_PASSWORD") ?? "password123"
  );
});

Cypress.Commands.add("loginAsLeader", () => {
  cy.login(
    Cypress.env("LEADER_NPK")      ?? "23456",
    Cypress.env("LEADER_PASSWORD") ?? "password123"
  );
});

export {};
