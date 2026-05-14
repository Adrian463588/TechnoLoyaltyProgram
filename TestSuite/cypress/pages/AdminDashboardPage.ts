/**
 * TestSuite/cypress/pages/AdminDashboardPage.ts
 *
 * Page Object Model for the Admin (HC_PM) Dashboard.
 *
 * SOLID — SRP: selector/navigation only, no assertions.
 * DRY: all admin selectors in one place.
 */

export class AdminDashboardPage {
  // ── Navigation ────────────────────────────────────────────────────────────
  visit(): Cypress.Chainable<AUTWindow> {
    return cy.visit("/admin/dashboard");
  }

  visitRedemptions(): Cypress.Chainable<AUTWindow> {
    return cy.visit("/admin/redemptions");
  }

  visitUploads(): Cypress.Chainable<AUTWindow> {
    return cy.visit("/admin/uploads");
  }

  // ── Upload panel ──────────────────────────────────────────────────────────
  getUploadButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("[data-testid=upload-btn]");
  }

  getFileDropzone(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("[data-testid=file-dropzone]");
  }

  getUploadTable(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("[data-testid=admin-uploads-table]");
  }

  // ── Redemption management ─────────────────────────────────────────────────
  getRedemptionTable(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("[data-testid=redemption-table]");
  }

  getRedemptionRows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("[data-testid^=redemption-row]");
  }

  getStatusButton(id: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(`[data-testid=status-btn-${id}]`);
  }
}
