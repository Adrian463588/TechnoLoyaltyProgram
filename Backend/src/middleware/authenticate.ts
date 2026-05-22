/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * Backend/src/middleware/authenticate.ts
 *
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token, attaches user to request.
 *
 * SOLID — SRP: only verifies identity, does NOT check roles.
 */

import type { RequestHandler } from "express";
import { jwtDecrypt } from "jose";
import { createHmac, hkdf, timingSafeEqual } from "node:crypto";
import type { SessionUser } from "@/types/api.types";

/**
 * Derives the encryption key from NEXTAUTH_SECRET using HKDF, 
 * matching NextAuth v5 default behavior.
 */
async function getDerivedEncryptionKey(secret: string): Promise<Uint8Array> {
  const info = "NextAuth.js Generated Encryption Key";
  // HKDF derivation
  return new Promise((resolve, reject) => {
    hkdf(
      "sha256",
      secret,
      "",
      info,
      32,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(new Uint8Array(derivedKey));
      }
    );
  });
}

let derivedKey: Uint8Array | null = null;

interface InternalTokenPayload extends SessionUser {
  exp: number;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isInternalTokenPayload(value: unknown): value is InternalTokenPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["id"] === "string" &&
    typeof candidate["npk"] === "string" &&
    typeof candidate["name"] === "string" &&
    typeof candidate["email"] === "string" &&
    (candidate["role"] === "MITRA" ||
      candidate["role"] === "TEAM_LEADER" ||
      candidate["role"] === "HC_PM") &&
    typeof candidate["exp"] === "number"
  );
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toRequiredString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toUserRole(value: unknown): SessionUser["role"] | null {
  if (value === "MITRA" || value === "TEAM_LEADER" || value === "HC_PM") {
    return value;
  }
  return null;
}

function buildSessionUser(input: {
  id: string;
  npk: string;
  name: string;
  email: string;
  role: SessionUser["role"];
  divisionId?: string;
}): SessionUser {
  const user: SessionUser = {
    id: input.id,
    npk: input.npk,
    name: input.name,
    email: input.email,
    role: input.role,
  };
  if (input.divisionId) {
    user.divisionId = input.divisionId;
  }
  return user;
}

function verifyInternalToken(token: string, secret: string): SessionUser | null {
  if (!token.startsWith("internal.")) {
    console.log("[verifyInternalToken] Does not start with internal.");
    return null;
  }

  const [, payload, signature] = token.split(".");
  if (!payload || !signature) {
    console.log("[verifyInternalToken] Missing payload or signature");
    return null;
  }

  const expected = signPayload(payload, secret);
  if (!safeEqual(signature, expected)) {
    console.log("[verifyInternalToken] Signature mismatch", { signature, expected, secretLength: secret.length });
    return null;
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
  if (!isInternalTokenPayload(parsed)) {
    console.log("[verifyInternalToken] Invalid payload structure", parsed);
    return null;
  }
  
  if ((parsed as any).exp < Math.floor(Date.now() / 1000)) {
    console.log("[verifyInternalToken] Token expired");
    return null;
  }

  const divisionId = toOptionalString((parsed as any).divisionId);
  return buildSessionUser({
    id: (parsed as any).id,
    npk: (parsed as any).npk,
    name: (parsed as any).name,
    email: (parsed as any).email,
    role: (parsed as any).role,
    ...(divisionId ? { divisionId } : {}),
  });
}

export const authenticate: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.error("[Auth] NEXTAUTH_SECRET is not defined");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  console.log("[Auth] NEXTAUTH_SECRET length:", secret.length, "starts with:", secret.substring(0, 5));

  try {
    const internalUser = verifyInternalToken(token, secret);
    if (internalUser) {
      req.user = internalUser;
      next();
      return;
    }

    if (!derivedKey) {
      derivedKey = await getDerivedEncryptionKey(secret);
    }

    // Decrypt JWE token
    const { payload } = await jwtDecrypt(token, derivedKey, {
      clockTolerance: 15, // 15 seconds tolerance
    });

    if (!payload) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    const role = toUserRole(payload["role"]);
    if (!role) {
      res.status(401).json({ error: "Invalid session role" });
      return;
    }

    const divisionId = toOptionalString(payload["divisionId"]);
    req.user = buildSessionUser({
      id: toRequiredString(payload["id"]),
      npk: toRequiredString(payload["npk"]),
      name: toRequiredString(payload["name"]),
      email: toRequiredString(payload["email"]),
      role,
      ...(divisionId ? { divisionId } : {}),
    });
    next();
  } catch (err) {
    console.error("[Auth] Authentication failed:", err);
    res.status(401).json({ error: "Authentication failed" });
  }
};
