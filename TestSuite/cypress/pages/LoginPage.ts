/**
 * cypress/pages/LoginPage.ts
 *
 * Page Object: /login
 *
 * Covers: form render, validation errors, demo-dock, successful login.
 */

import { routes } from "../support/routes";
import { sel } from "../support/selectors";
import { loadTestUser, type TestRole } from "../support/users";

export class LoginPage {
  // ── Navigation ────────────────────────────────────────────────────────
  visit() {
    cy.visit(routes.login);
    cy.get("[data-testid=login-form][data-hydrated=true]", { timeout: 15_000 }).should("exist");
    return this;
  }

  // ── Assertions ────────────────────────────────────────────────────────
  assertLoaded() {
    cy.get(sel.auth.npkInput,      { timeout: 10_000 }).should("be.visible");
    cy.get(sel.auth.passwordInput).should("be.visible");
    cy.get(sel.auth.submitButton).should("be.visible");
    return this;
  }

  assertInvalidSubmitErrors() {
    // react-hook-form + Zod renders role=alert paragraphs on invalid submit
    cy.get(`${sel.auth.npkError}, ${sel.auth.passwordError}`)
      .first()
      .should("have.attr", "role", "alert");
    return this;
  }

  assertNpkValue(expected: string) {
    cy.get(sel.auth.npkInput).should("have.value", expected);
    return this;
  }

  assertLoginError() {
    cy.get(sel.auth.errorAlert, { timeout: 10_000 }).should("be.visible");
    return this;
  }

  // ── Interactions ──────────────────────────────────────────────────────
  fillNpk(npk: string) {
    cy.get(sel.auth.npkInput, { timeout: 8_000 }).should("be.visible");
    cy.get(sel.auth.npkInput).clear();
    cy.get(sel.auth.npkInput).type(npk);
    return this;
  }

  fillPassword(password: string) {
    cy.get(sel.auth.passwordInput).clear();
    cy.get(sel.auth.passwordInput).type(password, { log: false });
    return this;
  }

  submit() {
    cy.get(sel.auth.submitButton).click();
    return this;
  }

  /**
   * Open the floating demo-dock panel and click the account whose label matches.
   * The demo dock is a bottom-left floating button (UserCircle icon).
   */
  openDemoDock() {
    cy.get(sel.auth.demoDockToggle, { timeout: 8_000 }).should("exist").click({ force: true });
    // Panel is visible when the "Account Selector" heading appears
    cy.contains("Account Selector", { timeout: 6_000 }).should("be.visible");
    return this;
  }

  selectDemoAccount(label: string) {
    cy.contains("button", label).click();
    return this;
  }

  // ── Composite flows ───────────────────────────────────────────────────
  loginAs(npk: string, password: string, timeoutMs = 20_000) {
    this.visit().fillNpk(npk).fillPassword(password).submit();
    cy.url({ timeout: timeoutMs }).should("not.include", routes.login);
    return this;
  }

  loginAsRole(role: TestRole) {
    return loadTestUser(role).then((user) => this.loginAs(user.npk, user.password));
  }
}
