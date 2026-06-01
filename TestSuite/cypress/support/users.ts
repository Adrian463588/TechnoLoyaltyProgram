/**
 * cypress/support/users.ts
 *
 * Seed/demo user credentials per role.
 * Defaults match the seeded demo accounts in the deployed app.
 * Override via environment variables for CI/CD.
 */

export type TestRole = "MITRA" | "TEAM_LEADER" | "HC_PM";

export interface TestUser {
  readonly role:     TestRole;
  readonly npk:      string;
  readonly password: string;
  readonly homePath: string;
}

function env(key: string, fallback: string): string {
  const value = Cypress.env(key);
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function getTestUser(role: TestRole): TestUser {
  switch (role) {
    case "HC_PM":
      return {
        role,
        npk:      env("ADMIN_NPK",      "12345"),
        password: env("ADMIN_PASSWORD",  "password123"),
        homePath: "/admin/dashboard",
      };
    case "TEAM_LEADER":
      return {
        role,
        npk:      env("LEADER_NPK",     "23456"),
        password: env("LEADER_PASSWORD", "password123"),
        homePath: "/leader/dashboard",
      };
    case "MITRA":
      return {
        role,
        npk:      env("EMPLOYEE_NPK",     "34567"),
        password: env("EMPLOYEE_PASSWORD", "password123"),
        homePath: "/employee/dashboard",
      };
  }
}
