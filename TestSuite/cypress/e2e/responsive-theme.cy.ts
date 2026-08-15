/**
 * Responsive and theme contract for the primary MITRA dashboard.
 * Covers the DESIGN.md viewport baseline without mutating domain data.
 */

import { sel } from "../support/selectors";

const viewports = [375, 768, 1280] as const;

describe("Responsive and theme contract", () => {
  for (const width of viewports) {
    it(`renders at ${width}px in light and dark mode`, () => {
      cy.loginAsRole("MITRA");
      cy.viewport(width, 900);
      cy.visit("/employee/dashboard");

      cy.get("[data-testid=employee-dashboard-heading]", { timeout: 15_000 })
        .should("be.visible");
      cy.get(sel.shell.themeToggle)
        .should("be.visible")
        .and("have.attr", "aria-label")
        .and("match", /theme/i);
      cy.get("html", { timeout: 10_000 }).should("have.attr", "data-theme", "light");
      assertNoHorizontalOverflow(width);

      cy.get(sel.shell.themeToggle).click();
      cy.get("html").should("have.attr", "data-theme", "dark");
      assertNoHorizontalOverflow(width);

      cy.get(sel.shell.themeToggle).click();
      cy.get("html").should("have.attr", "data-theme", "light");
    });
  }
});

function assertNoHorizontalOverflow(width: number): void {
  cy.document().then((document) => {
    expect(document.documentElement.scrollWidth).to.be.at.most(width + 2);
  });
}
