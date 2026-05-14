/**
 * TestSuite/cypress/pages/EmployeeDashboardPage.ts
 * Page Object Model — Employee Dashboard
 *
 * All selectors map to data-testid attributes defined in the
 * Glassmorphism 2.0 dashboard redesign.
 *
 * Principle: SRP — this class knows only about the dashboard DOM.
 *            OCP — add new assertions without modifying existing ones.
 */

export class EmployeeDashboardPage {
  // ── Selectors ─────────────────────────────────────────────
  readonly url          = "/employee/dashboard";
  readonly heading      = "h1";
  readonly tokenValue   = "[data-testid=employee-dashboard-total-tokens-value]";
  readonly tierProgress = "[data-testid=employee-dashboard-tier-progress]";
  readonly redeemBtn    = "[data-testid=employee-dashboard-redeem-button]";
  readonly activityRow  = "[data-testid^=employee-dashboard-activity-]";
  readonly profileTrigger = "[data-testid=profile-menu-trigger]";

  // ── Actions ───────────────────────────────────────────────
  visit() {
    cy.visit(this.url);
    return this;
  }

  // ── Assertions ────────────────────────────────────────────
  assertHeadingVisible() {
    cy.contains(this.heading, "Dashboard").should("be.visible");
    return this;
  }

  assertTokenCounterVisible() {
    cy.get(this.tokenValue, { timeout: 8000 })
      .should("be.visible")
      .invoke("text")
      .then((text) => {
        expect(text.replace(/,/g, "")).to.match(/^\d+$/);
      });
    return this;
  }

  assertTierProgressExists() {
    cy.get(this.tierProgress).should("exist");
    return this;
  }

  assertRedeemButtonVisible() {
    cy.get(this.redeemBtn)
      .should("be.visible")
      .and("contain", "Catalog");
    return this;
  }

  assertActivityRowsExist(minCount = 1) {
    cy.get(this.activityRow).should("have.length.gte", minCount);
    return this;
  }

  openProfileDropdown() {
    cy.get(this.tokenValue, { timeout: 8000 }).should("be.visible");
    cy.get(this.profileTrigger).click({ force: true });
    cy.get("[data-slot=dropdown-menu-content]", { timeout: 6000 }).should("exist");
    return this;
  }
}
