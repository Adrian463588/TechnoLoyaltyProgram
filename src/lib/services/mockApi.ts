import { 
  mockCurrentUser, 
  mockRewards, 
  mockRequests, 
  mockTeamMembers, 
  mockUploads, 
  mockSnapshots, 
  mockAuditLogs 
} from "../mocks/data";
import { RewardRequestStatus } from "@/types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const LoyaltyService = {
  async getCurrentUser() {
    await delay(300);
    return mockCurrentUser;
  },

  async getRewards() {
    await delay(300);
    return mockRewards;
  },

  async getMyRequests() {
    await delay(300);
    return mockRequests.filter(r => r.userId === mockCurrentUser.userId);
  },

  async requestReward(rewardId: string) {
    await delay(500);
    const reward = mockRewards.find(r => r.id === rewardId);
    if (!reward || reward.tokenCost > mockCurrentUser.totalTokens) {
      throw new Error("Invalid request");
    }
    return { success: true, message: "Reward requested successfully." };
  }
};

export const LeaderService = {
  async getTeamMembers() {
    await delay(300);
    return mockTeamMembers;
  }
};

export const AdminService = {
  async getUploads() {
    await delay(300);
    return mockUploads;
  },

  async getSnapshots() {
    await delay(300);
    return mockSnapshots;
  },

  async getPendingRequests() {
    await delay(300);
    return mockRequests.filter(r => r.status === "Pending");
  },

  async getAllRequests() {
    await delay(300);
    return mockRequests;
  },

  async updateRequestStatus(requestId: string, status: RewardRequestStatus, reason?: string) {
    await delay(500);
    return { success: true, status, requestId, reason };
  },

  async getAuditLogs() {
    await delay(300);
    return mockAuditLogs;
  }
};
