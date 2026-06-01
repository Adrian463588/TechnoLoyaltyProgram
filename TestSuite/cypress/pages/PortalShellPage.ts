/**
 * cypress/pages/PortalShellPage.ts
 *
 * Page Object: App-wide shell — navbar, profile menu, logout, route guards.
 *
 * The navbar uses Radix DropdownMenu.  The trigger wraps a <m.div> tagged
 * data-testid="profile-menu-trigger" and the menu content wrapper is tagged
 * data-testid="profile-menu-content" (inside DropdownMenuContent).
 * The logout action opens a Dialog confirmation.
 */

import { routes } from "../support/routes";
import { sel } from "../support/selectors";
import { type TestRole } from "../support/users";

export class PortalShellPage {
  // ── Route guard helpers ────────────────────────────────────────────────
  assertAnonymousRedirect(path: string) {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit(path, { failOnStatusCode: false });
    cy.url({ timeout: 15_000 }).should("include", routes.login);
    return this;
  }

  assertRedirectedAwayFrom(path: string) {
    cy.visit(path, { failOnStatusCode: false });
    cy.url({ timeout: 15_000 }).should("not.include", path);
    return this;
  }

  assertRoleHome(role: TestRole) {
    const expectedPath =
      role === "HC_PM"       ? routes.admin.dashboard  :
      role === "TEAM_LEADER" ? routes.leader.dashboard :
                               routes.employee.dashboard;

    cy.visit(expectedPath);
    cy.url({ timeout: 15_000 }).should("include", expectedPath);
    cy.get(sel.common.h1, { timeout: 10_000 }).should("be.visible");
    return this;
  }

  // ── Profile menu ───────────────────────────────────────────────────────
  openProfileMenu() {
    cy.get(sel.shell.profileTrigger, { timeout: 10_000 })
      .should("be.visible")
      .click({ force: true });

    // Wait for the Radix dropdown or custom menu wrapper to appear
    cy.get(sel.shell.profileMenuWrap, { timeout: 6_000 }).should("be.visible");
    return this;
  }

  assertProfileMenuVisible() {
    cy.get(sel.shell.profileMenuWrap).should("be.visible");
    return this;
  }

  clickSignOut() {
    // Sign out menu item — Radix renders a [role=menuitem] or div/button
    cy.contains(/Sign out/i).click({ force: true });
    return this;
  }

  confirmLogout() {
    // Logout confirmation Dialog has a "Sign Out" confirm button
    cy.contains("button", /^Sign Out$/, { timeout: 6_000 }).click();
    cy.url({ timeout: 15_000 }).should("include", routes.login);
    return this;
  }

  // ── Composite ─────────────────────────────────────────────────────────
  logout() {
    this.openProfileMenu().clickSignOut().confirmLogout();
    return this;
  }
}
