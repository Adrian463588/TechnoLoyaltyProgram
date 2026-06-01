/**
 * cypress/e2e/chatbot.cy.ts
 *
 * Spec: LoyaltyBot chatbot widget — available for all three roles.
 *
 * Uses ChatbotWidgetPage POM.  Tests are read-only (no destructive mutations).
 * SSE streaming is awaited via assertResponseAppears() which has a 35 s timeout.
 */

import { ChatbotWidgetPage } from "../pages/ChatbotWidgetPage";
import { routes } from "../support/routes";
import type { TestRole } from "../support/users";

const chatbot = new ChatbotWidgetPage();

const roleHomes: Record<TestRole, string> = {
  MITRA:       routes.employee.dashboard,
  TEAM_LEADER: routes.leader.dashboard,
  HC_PM:       routes.admin.dashboard,
};

describe("LoyaltyBot chatbot widget", () => {
  (["MITRA", "TEAM_LEADER", "HC_PM"] as const).forEach((role) => {
    describe(`as ${role}`, () => {
      beforeEach(() => {
        cy.loginAsRole(role);
        cy.visit(roleHomes[role]);
      });

      it("renders the floating toggle button", () => {
        chatbot.assertWidgetAvailable();
      });

      it("opens the chat panel and shows the input field", () => {
        chatbot.open().assertInputEnabled();
      });

      it("receives a response after sending a message", () => {
        chatbot
          .open()
          .sendMessage("Cek ringkasan token saya")
          .assertResponseAppears();
      });
    });
  });
});
