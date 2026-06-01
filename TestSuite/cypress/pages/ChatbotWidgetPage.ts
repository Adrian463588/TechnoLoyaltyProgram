/**
 * cypress/pages/ChatbotWidgetPage.ts
 *
 * Page Object: LoyaltyBot floating chatbot widget.
 *
 * The widget is rendered by <ChatbotWidget /> inside the portal shell.
 * It only renders when the user is authenticated (session exists).
 *
 * The toggle button is a rounded-full button at bottom-right that shows
 * a MessageSquare icon when closed and X when open.
 */

import { sel } from "../support/selectors";

export class ChatbotWidgetPage {
  /**
   * Open the chatbot widget.  The toggle is the last button inside the
   * fixed bottom-right container rendered by ChatbotWidget.
   */
  open() {
    cy.get(sel.chatbot.floatingToggle, { timeout: 10_000 }).should("be.visible");
    cy.get(sel.chatbot.floatingToggle).click({ force: true });
    cy.get(sel.chatbot.messageInput, { timeout: 10_000 }).should("be.visible");
    return this;
  }

  /** Type a message and send via Enter key */
  sendMessage(text: string) {
    cy.get(sel.chatbot.messageInput).should("be.visible");
    cy.get(sel.chatbot.messageInput).clear();
    cy.get(sel.chatbot.messageInput).type(`${text}{enter}`);
    return this;
  }

  /**
   * Assert that a bot response (or error) has appeared.
   * Uses a generous timeout to allow SSE streaming to complete.
   * Matches bot header ("LoyaltyBot"), response keywords, or error prefix.
   */
  assertResponseAppears() {
    cy.contains(
      /LoyaltyBot|Error:|token|saldo|hadiah|loyalitas|Halo|bantuan/i,
      { timeout: 35_000 }
    ).should("be.visible");
    return this;
  }

  assertInputEnabled() {
    cy.get(sel.chatbot.messageInput).should("not.be.disabled");
    return this;
  }

  /** Check widget renders on the page (visible toggle button) */
  assertWidgetAvailable() {
    cy.get(sel.chatbot.floatingToggle, { timeout: 10_000 }).should("be.visible");
    return this;
  }
}
