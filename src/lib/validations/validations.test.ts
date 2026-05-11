/**
 * Unit Tests — Zod Validation Schemas
 */

import { describe, it, expect } from "vitest";
import {
  loginSchema,
  updateStatusSchema,
  redeemRequestSchema,
  createUserSchema,
} from "@/lib/validations";

// ── loginSchema ───────────────────────────────────────────────
describe("loginSchema", () => {
  it("accepts valid NPK and password", () => {
    const result = loginSchema.safeParse({ npk: "EMP001", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects NPK shorter than 3 chars", () => {
    const result = loginSchema.safeParse({ npk: "AB", password: "secret123" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.npk).toBeDefined();
  });

  it("rejects password shorter than 6 chars", () => {
    const result = loginSchema.safeParse({ npk: "EMP001", password: "abc" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toBeDefined();
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── updateStatusSchema ────────────────────────────────────────
describe("updateStatusSchema", () => {
  const validStatuses = [
    "DRAFT", "PENDING_VERIFICATION", "VERIFIED",
    "REJECTED", "PURCHASED", "PICKUP_SCHEDULED",
    "COMPLETED", "CANCELLED",
  ];

  validStatuses.forEach((status) => {
    it(`accepts status "${status}"`, () => {
      const result = updateStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });
  });

  it("rejects unknown status", () => {
    const result = updateStatusSchema.safeParse({ status: "UNKNOWN" });
    expect(result.success).toBe(false);
  });

  it("accepts optional reason string", () => {
    const result = updateStatusSchema.safeParse({
      status: "REJECTED",
      reason: "Does not meet criteria",
    });
    expect(result.success).toBe(true);
    expect(result.data?.reason).toBe("Does not meet criteria");
  });

  it("allows missing reason (optional field)", () => {
    const result = updateStatusSchema.safeParse({ status: "VERIFIED" });
    expect(result.success).toBe(true);
    expect(result.data?.reason).toBeUndefined();
  });
});

// ── redeemRequestSchema ───────────────────────────────────────
describe("redeemRequestSchema", () => {
  it("accepts a valid rewardItemId", () => {
    const result = redeemRequestSchema.safeParse({ rewardItemId: "item-cuid-123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty rewardItemId", () => {
    const result = redeemRequestSchema.safeParse({ rewardItemId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing rewardItemId", () => {
    const result = redeemRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── createUserSchema ──────────────────────────────────────────
describe("createUserSchema", () => {
  const validUser = {
    npk: "EMP001",
    name: "Ahmad Fauzi",
    email: "ahmad@berijalan.id",
    password: "secret123",
    role: "MITRA" as const,
  };

  it("accepts a valid user payload", () => {
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = createUserSchema.safeParse({ ...validUser, email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it("rejects unknown role value", () => {
    const result = createUserSchema.safeParse({ ...validUser, role: "SUPER_ADMIN" });
    expect(result.success).toBe(false);
  });

  it("defaults role to MITRA when not provided", () => {
    const { role: _, ...withoutRole } = validUser;
    const result = createUserSchema.safeParse(withoutRole);
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("MITRA");
  });
});
