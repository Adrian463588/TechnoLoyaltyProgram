import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks must be hoisted before imports ─────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "u1", role: "MITRA", npk: "M001", name: "Test User" },
  }),
  getServerToken: vi.fn().mockResolvedValue("mock-token"),
}));

vi.mock("@/lib/api-client", () => ({
  employeeApi: {
    getDashboard: vi.fn().mockResolvedValue({
      user: { id: "u1", name: "Test User", npk: "M001" },
      tokenSummary: {
        totalTokens:        4200,
        currentTier:        "EMERALD",
        isEligibleForReward: true,
        periodEnd:          "2024-12-15",
        memberStatus:       "ACTIVE",
        pointsToNextTier:   800,
        cumulativeValue:    4200,
      },
      recentRedemptions: [],
    }),
  },
}));

vi.mock("@/components/shared/breadcrumb", () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb">Breadcrumb</nav>,
}));

vi.mock("@/components/dashboard/token-hero-section", () => ({
  TokenHeroSection: ({ tokenBalance, tier }: { tokenBalance: number; tier: string }) => (
    <div data-testid="token-hero">
      <span>{tokenBalance}</span>
      <span>{tier}</span>
    </div>
  ),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import EmployeeDashboardPage from "./page";

describe("EmployeeDashboardPage", () => {
  it("renders the dashboard with correct layout after data fetch", async () => {
    const Page = await EmployeeDashboardPage();
    render(Page);

    expect(screen.getByTestId("employee-dashboard-heading")).toBeInTheDocument();
    expect(screen.getByText(/P2: Jun 16/)).toBeInTheDocument();
    expect(screen.getByText("Earning Streak")).toBeInTheDocument();
    expect(screen.getByText("Redemption")).toBeInTheDocument();
    expect(screen.getByText("Token History")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Rewards")).toBeInTheDocument();

    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("token-hero")).toBeInTheDocument();
  });
});
