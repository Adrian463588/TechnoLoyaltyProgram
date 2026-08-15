import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

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
      user: { id: "u1", name: "Test User", npk: "M001", membershipTier: "EMERALD" },
      tokenSummary: {
        totalTokens:        4200,
        currentTier:        "EMERALD",
        isEligibleForReward: true,
        eligibilityReasons: [],
        periodEnd:          "2024-12-15",
        memberStatus:       "ACTIVE",
        pointsToNextTier:   800,
        cumulativeValue:    4200,
      },
      recentRedemptions: [],
    }),
  },
  adminApi: {
    getSystemSettings: vi.fn().mockResolvedValue({
      id: "settings-1",
      rewardPickupLocation: "HC Office - Main Building",
      p1Start: "06-16",
      p1End: "12-15",
      p2Start: "12-16",
      p2End: "06-15",
      claimP1Start: "01-01",
      claimP1End: "01-31",
      claimP2Start: "07-01",
      claimP2End: "07-31",
      updatedAt: "2024-01-01T00:00:00.000Z",
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

    expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/Token History/i)).toBeInTheDocument();
    expect(screen.getByText(/Pickup Point/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();

    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
  });
});
