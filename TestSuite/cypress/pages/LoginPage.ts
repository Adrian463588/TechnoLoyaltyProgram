/**
 * TestSuite/cypress/pages/LoginPage.ts
 * Page Object Model — Login Page
 *
 * Principle: SRP — encapsulates all login UI interactions in one place.
 */

export class LoginPage {
  // ── Selectors ─────────────────────────────────────────────
  readonly npkInput     = "[data-testid=login-npk]";
  readonly passwordInput = "[data-testid=login-password]";
  readonly submitBtn    = "[data-testid=login-submit]";

  // ── Actions ───────────────────────────────────────────────
  visit() {
    cy.visit("/login");
    return this;
  }

  fillNpk(npk: string) {
    cy.get(this.npkInput, { timeout: 8000 }).should("be.visible").clear();
    cy.get(this.npkInput).type(npk);
    return this;
  }

  fillPassword(password: string) {
    cy.get(this.passwordInput).clear();
    cy.get(this.passwordInput).type(password);
    return this;
  }

  submit() {
    cy.get(this.submitBtn).click();
    return this;
  }

  /** Full login flow — wait until redirected off /login. */
  loginAs(npk: string, password: string, timeoutMs = 15_000) {
    this.visit().fillNpk(npk).fillPassword(password).submit();
    cy.url({ timeout: timeoutMs }).should("not.include", "/login");
    return this;
  }
}
