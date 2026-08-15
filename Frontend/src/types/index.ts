export type Role = "Mitra" | "TeamLeader" | "HCPM";

export type Division = "Optel" | "Techno";

export type MembershipTier = "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";

export type TierStatus = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  division: Division;
}

export interface TokenSummary {
  userId: string;
  totalTokens: number;
  currentTier: TierStatus;
  pointsToNextTier: number;
  totalForNextTier: number;
  isEligibleForReward: boolean;
  activePeriod: string;
  status: "Active" | "Downgraded" | "Reset" | "Inactive";
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  category: string | null;
  imageUrl?: string;
  isAvailable: boolean;
  stock: number | null;
  minTier: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
}

export type RewardRequestStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "PURCHASED"
  | "PICKUP_SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export interface RewardRequest {
  id: string;
  userId: string;
  userNpk?: string;
  userName?: string;
  rewardId: string;
  rewardName: string;
  tokensSpent: number;
  status: RewardRequestStatus;
  requestedAt: string;
  updatedAt: string;
  rejectReason?: string;
}

export interface UploadValidationIssue {
  row: number;
  column: string;
  issue: string;
  severity: "Error" | "Warning";
}

export interface MonthlyUpload {
  id: string;
  filename: string;
  uploadedAt: string;
  status: "Staged" | "Processing" | "Completed" | "Failed";
  validRows: number;
  errorRows: number;
  issues: UploadValidationIssue[];
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  division: Division;
  tokens: number;
  tier: TierStatus;
  status: TokenSummary["status"];
}

export interface PeriodSnapshot {
  id: string;
  periodName: string;
  cutOffDate: string;
  totalTokensIssued: number;
  totalUsersActive: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  targetId?: string;
  timestamp: string;
  details: string;
}
