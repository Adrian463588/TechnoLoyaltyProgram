/**
 * cypress/support/commands.ts
 *
 * Custom Cypress commands.
 *
 * cy.login(npk, password)          — caches session via cy.session()
 * cy.loginAsRole(role)             — typed role shorthand
 * cy.loginAsAdmin()                — HC_PM seed account
 * cy.loginAsLeader()               — TEAM_LEADER seed account
 * cy.loginAsEmployee()             — MITRA seed account
 * cy.assertNoServerError()         — assert page is not a 500
 */

/// <reference types="cypress" />

import { sel } from "./selectors";
import { getTestUser, type TestRole } from "./users";

// ── Type declarations ──────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(npk: string, password: string): Chainable<void>;
      loginAsRole(role: TestRole): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginAsLeader(): Chainable<void>;
      loginAsEmployee(): Chainable<void>;
      assertNoServerError(): Chainable<void>;
    }
  }
}

// ── login ──────────────────────────────────────────────────────────────────
Cypress.Commands.add("login", (npk: string, password: string) => {
  cy.session(
    ["auth", npk],
    () => {
      cy.visit("/login");
      cy.get(sel.auth.npkInput, { timeout: 10_000 }).should("be.visible");
      cy.get(sel.auth.npkInput).clear();
      cy.get(sel.auth.npkInput).type(npk);
      cy.get(sel.auth.passwordInput).clear();
      cy.get(sel.auth.passwordInput).type(password, { log: false });
      cy.get(sel.auth.submitButton).click();
      // Wait until we leave the login page
      cy.url({ timeout: 20_000 }).should("not.include", "/login");
    },
    {
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

// ── loginAsRole ────────────────────────────────────────────────────────────
Cypress.Commands.add("loginAsRole", (role: TestRole) => {
  const user = getTestUser(role);
  cy.login(user.npk, user.password);
});

// ── convenience wrappers ───────────────────────────────────────────────────
Cypress.Commands.add("loginAsAdmin",    () => cy.loginAsRole("HC_PM"));
Cypress.Commands.add("loginAsLeader",   () => cy.loginAsRole("TEAM_LEADER"));
Cypress.Commands.add("loginAsEmployee", () => cy.loginAsRole("MITRA"));

// ── assertNoServerError ────────────────────────────────────────────────────
Cypress.Commands.add("assertNoServerError", () => {
  cy.get(sel.common.body).should("not.contain.text", "500");
  cy.get(sel.common.body).should("not.contain.text", "Internal Server Error");
});

export {};
