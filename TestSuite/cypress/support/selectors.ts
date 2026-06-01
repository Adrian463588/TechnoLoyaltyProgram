/**
 * cypress/support/selectors.ts
 *
 * Single source of truth for all Cypress element selectors.
 * Mapped 1:1 from frontend data-testid attributes and accessible text.
 * Never reference these strings directly in specs — always use this object.
 */

export const sel = {
  // ── Auth ────────────────────────────────────────────────────────────────
  auth: {
    npkInput:      "[data-testid=login-npk]",
    passwordInput: "[data-testid=login-password]",
    submitButton:  "[data-testid=login-submit]",
    npkError:      "#npk-error",
    passwordError: "#password-error",
    /** floating demo dock toggle (bottom-left UserCircle button) */
    demoDockToggle: "button.fixed.bottom-6.left-6",
    errorAlert:    "[role=alert]",
  },

  // ── Shell / Navbar ───────────────────────────────────────────────────────
  shell: {
    /** profile menu trigger wraps a <m.div> with data-testid */
    profileTrigger:  "[data-testid=profile-menu-trigger]",
    /** Radix DropdownMenuContent — no data-testid on content element,
        but the inner wrapper div has data-testid=profile-menu-content */
    profileMenuWrap: "[data-testid=profile-menu-content]",
    /** Sign Out item in Radix menu — matched by visible text */
    signOutItem:     "button:contains('Sign out'), [role=menuitem]:contains('Sign out')",
    logoutConfirmBtn:"button:contains('Sign Out')",
  },

  // ── Employee ─────────────────────────────────────────────────────────────
  employee: {
    dashboardHeading: "[data-testid=employee-dashboard-heading]",
    tokenValue:       "[data-testid=employee-dashboard-total-tokens-value]",
    tierProgress:     "[data-testid=employee-dashboard-tier-progress]",
    redeemButton:     "[data-testid=employee-dashboard-redeem-button]",
    activityRow:      "[data-testid^=employee-dashboard-activity-]",
    rewardCard:       "[data-testid^=redeem-btn-]",
    confirmRedeemBtn: "[data-testid=confirm-redeem-btn]",
    doneBtn:          "[data-testid=done-btn]",
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  admin: {
    divisionSelect:    "[data-testid=division-select]",
    /** Two upload dropzone impls — prefer the shared component id */
    uploadDropzone:    "[data-testid=upload-dropzone], [data-testid=admin-upload-dropzone]",
    fileInput:         "[data-testid=file-input], [data-testid=admin-upload-file-input]",
    commitBtn:         "[data-testid=commit-btn], [data-testid=admin-upload-submit-button]",
    redemptionsTable:  "[data-testid=redemptions-table]",
    verifyDrawer:      "[data-testid=verify-redemption-drawer]",
    approveBtn:        "[data-testid=approve-redemption-btn]",
    rejectReasonInput: "[data-testid=reject-reason-input]",
    confirmRejectBtn:  "[data-testid=confirm-reject-btn]",
    adjMitraInput:     "[data-testid=adj-mitra-id]",
    submitAdjBtn:      "[data-testid=submit-adjustment-btn]",
  },

  // ── Leader ───────────────────────────────────────────────────────────────
  leader: {
    confirmationRow:    "[data-testid=leader-confirmation-row]",
    confirmActiveBtn:   "[data-testid=leader-confirm-active-btn]",
    confirmResignedBtn: "[data-testid=leader-confirm-resigned-btn]",
  },

  // ── Chatbot ──────────────────────────────────────────────────────────────
  chatbot: {
    /** Bottom-right floating toggle rendered by ChatbotWidget */
    floatingToggle: ".fixed.bottom-6.right-6 > button",
    messageInput:   "input[placeholder='Ketik pesan Anda...']",
    sendButton:     ".fixed.bottom-6.right-6 button[class*='bg-']:last",
  },

  // ── Common ───────────────────────────────────────────────────────────────
  common: {
    body:    "body",
    h1:      "h1",
    dialog:  "[role=dialog]",
    table:   "table",
    /** NextAuth / App error text — fail-fast on 500 */
    noError: { not: { containText: "500" } },
  },
} as const;
