import { 
  RewardItem, 
  RewardRequest, 
  TeamMemberSummary, 
  TokenSummary, 
  PeriodSnapshot,
  MonthlyUpload,
  AuditLogEntry
} from "@/types";

export const mockCurrentUser: TokenSummary = {
  userId: "EMP-001",
  totalTokens: 4500,
  currentTier: "Gold",
  pointsToNextTier: 1500,
  totalForNextTier: 6000,
  isEligibleForReward: true,
  activePeriod: "P1 (Dec 16 - Jun 15)",
  status: "Active"
};

export const mockRewards: RewardItem[] = [
  {
    id: "RW-001",
    name: "Exclusive Partner Voucher IDR 100k",
    description: "Redeemable at participating partners.",
    tokenCost: 2000,
    category: "Voucher",
    imageUrl: "/placeholder-reward.jpg",
    isAvailable: true
  },
  {
    id: "RW-002",
    name: "Company Branded Hoodie",
    description: "High-quality premium hoodie.",
    tokenCost: 4500,
    category: "Merchandise",
    imageUrl: "/placeholder-reward.jpg",
    isAvailable: true
  },
  {
    id: "RW-003",
    name: "Extra PTO Day",
    description: "One additional day of paid time off.",
    tokenCost: 10000,
    category: "TimeOff",
    imageUrl: "/placeholder-reward.jpg",
    isAvailable: false
  },
  {
    id: "RW-004",
    name: "Tech Gadget Bundle",
    description: "Wireless mouse and premium keyboard.",
    tokenCost: 7500,
    category: "Merchandise",
    imageUrl: "/placeholder-reward.jpg",
    isAvailable: true
  }
];

export const mockRequests: RewardRequest[] = [
  {
    id: "REQ-1001",
    userId: "EMP-001",
    userName: "Alice Optel",
    rewardId: "RW-001",
    rewardName: "Exclusive Partner Voucher IDR 100k",
    tokensSpent: 2000,
    status: "Verified",
    requestedAt: "2026-05-09T10:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z"
  },
  {
    id: "REQ-1002",
    userId: "EMP-005",
    userName: "Bob Techno",
    rewardId: "RW-002",
    rewardName: "Company Branded Hoodie",
    tokensSpent: 4500,
    status: "Pending",
    requestedAt: "2026-05-10T09:15:00Z",
    updatedAt: "2026-05-10T09:15:00Z"
  },
  {
    id: "REQ-1003",
    userId: "EMP-012",
    userName: "Charlie Optel",
    rewardId: "RW-003",
    rewardName: "Extra PTO Day",
    tokensSpent: 10000,
    status: "Rejected",
    requestedAt: "2026-05-05T11:20:00Z",
    updatedAt: "2026-05-06T10:00:00Z",
    rejectReason: "Not eligible due to recent downgrade."
  }
];

export const mockTeamMembers: TeamMemberSummary[] = [
  { id: "EMP-001", name: "Alice Optel", division: "Optel", tokens: 5200, tier: "Gold", status: "Active" },
  { id: "EMP-005", name: "Bob Techno", division: "Techno", tokens: 1200, tier: "Silver", status: "Downgraded" },
  { id: "EMP-012", name: "Charlie Optel", division: "Optel", tokens: 0, tier: "Bronze", status: "Reset" },
  { id: "EMP-018", name: "Diana Techno", division: "Techno", tokens: 8500, tier: "Platinum", status: "Active" },
  { id: "EMP-022", name: "Eve Optel", division: "Optel", tokens: 3000, tier: "Silver", status: "Active" },
];

export const mockUploads: MonthlyUpload[] = [
  {
    id: "UPL-099",
    filename: "Optel_Slots_April_2026.xlsx",
    uploadedAt: "2026-05-01T08:00:00Z",
    status: "Completed",
    validRows: 142,
    errorRows: 0,
    issues: []
  },
  {
    id: "UPL-100",
    filename: "Techno_Sprints_April_2026.csv",
    uploadedAt: "2026-05-02T09:30:00Z",
    status: "Completed",
    validRows: 56,
    errorRows: 0,
    issues: []
  }
];

export const mockSnapshots: PeriodSnapshot[] = [
  {
    id: "SNAP-P2-2025",
    periodName: "P2 2025 (Jun 16 - Dec 15)",
    cutOffDate: "2025-12-15T23:59:59Z",
    totalTokensIssued: 450200,
    totalUsersActive: 198
  }
];

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "AUD-101",
    action: "Reward Request Verified",
    actorId: "HCPM-01",
    actorName: "Admin User",
    targetId: "REQ-1001",
    timestamp: "2026-05-10T14:30:00Z",
    details: "Verified redemption for EMP-001"
  },
  {
    id: "AUD-102",
    action: "Monthly Upload Processed",
    actorId: "HCPM-01",
    actorName: "Admin User",
    targetId: "UPL-100",
    timestamp: "2026-05-02T09:35:00Z",
    details: "Committed 56 rows for Techno division"
  }
];
