describe("Auth and role routing", () => {
  it("routes MITRA to the employee shell", () => {
    cy.loginAsEmployee();
    cy.visit("/employee/dashboard");
    cy.url().should("include", "/employee/dashboard");
    cy.contains("h1", /dashboard/i).should("be.visible");
  });

  it("routes TEAM_LEADER to the leader shell", () => {
    cy.loginAsLeader();
    cy.visit("/leader/team");
    cy.url().should("include", "/leader/team");
    cy.contains("h1", /team/i).should("be.visible");
  });

  it("routes HC_PM to the admin shell", () => {
    cy.loginAsAdmin();
    cy.visit("/admin/dashboard");
    cy.url().should("include", "/admin/dashboard");
    cy.contains("h1", /admin|dashboard|control/i).should("be.visible");
  });

  it("redirects anonymous users to login", () => {
    cy.clearCookies();
    cy.visit("/admin/dashboard", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
