export const AdminService = {
  getUploads: async () => {
    return [
      { id: "1", filename: "Optel_Points_Q1.csv", status: "Completed" as const, uploadedAt: new Date().toISOString(), validRows: 100, errorRows: 0, issues: [] }
    ];
  },
  getAllRequests: async () => {
    return [
      { 
        id: "1", 
        userId: "user-1", 
        userName: "Test Employee", 
        rewardId: "reward-1", 
        rewardName: "Test Reward", 
        tokensSpent: 500, 
        status: "Pending" as const, 
        requestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  },
  getAuditLogs: async () => {
    return [
      {
        id: "1",
        action: "File Uploaded",
        actorId: "admin-1",
        actorName: "HC PM Admin",
        actorNpk: "ADM001",
        targetId: "upload-1",
        targetType: "Upload",
        details: { fileName: "Optel_Q1.xlsx", rowCount: 150 },
        createdAt: new Date().toISOString(),
      },
    ];
  },
};

export const LoyaltyService = {
  getCurrentUser: async () => {
    return {
      totalTokens: 1500,
      isEligibleForReward: true
    };
  },
  getRewards: async () => {
    return [
      { id: "1", name: "Gift Card", tokenCost: 500, description: "Amazon Gift Card", category: "Voucher" as const, isAvailable: true }
    ];
  }
};
