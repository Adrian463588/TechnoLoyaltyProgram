/**
 * cypress/support/users.ts
 *
 * Test user credentials per role.
 * NPK defaults are non-sensitive local seed identifiers. Passwords are read
 * through cy.env() so secrets never enter the browser bundle or test source.
 */

export type TestRole = "MITRA" | "TEAM_LEADER" | "HC_PM";

export interface TestUser {
  readonly role:     TestRole;
  readonly npk:      string;
  readonly password: string;
  readonly homePath: string;
}

type TestEnv = Partial<Record<
  "ADMIN_NPK" | "ADMIN_PASSWORD" | "LEADER_NPK" | "LEADER_PASSWORD" | "EMPLOYEE_NPK" | "EMPLOYEE_PASSWORD",
  string
>>;

function requiredPassword(value: string | undefined, key: string): string {
  if (!value) throw new Error(`Missing Cypress secret: ${key}`);
  return value;
}

export function getTestUser(role: TestRole, npk: string, password: string): TestUser {
  switch (role) {
    case "HC_PM":
      return {
        role,
        npk,
        password,
        homePath: "/admin/dashboard",
      };
    case "TEAM_LEADER":
      return {
        role,
        npk,
        password,
        homePath: "/leader/dashboard",
      };
    case "MITRA":
      return {
        role,
        npk,
        password,
        homePath: "/employee/dashboard",
      };
  }
}

export function getDefaultNpk(role: TestRole): string {
  switch (role) {
    case "HC_PM": return "12345";
    case "TEAM_LEADER": return "23456";
    case "MITRA": return "34567";
  }
}

export function loadTestUser(role: TestRole): Cypress.Chainable<TestUser> {
  switch (role) {
    case "HC_PM":
      return cy.env<TestEnv>(["ADMIN_NPK", "ADMIN_PASSWORD"]).then((values) =>
        getTestUser(
          role,
          values.ADMIN_NPK || getDefaultNpk(role),
          requiredPassword(values.ADMIN_PASSWORD, "ADMIN_PASSWORD"),
        ));
    case "TEAM_LEADER":
      return cy.env<TestEnv>(["LEADER_NPK", "LEADER_PASSWORD"]).then((values) =>
        getTestUser(
          role,
          values.LEADER_NPK || getDefaultNpk(role),
          requiredPassword(values.LEADER_PASSWORD, "LEADER_PASSWORD"),
        ));
    case "MITRA":
      return cy.env<TestEnv>(["EMPLOYEE_NPK", "EMPLOYEE_PASSWORD"]).then((values) =>
        getTestUser(
          role,
          values.EMPLOYEE_NPK || getDefaultNpk(role),
          requiredPassword(values.EMPLOYEE_PASSWORD, "EMPLOYEE_PASSWORD"),
        ));
  }
}
