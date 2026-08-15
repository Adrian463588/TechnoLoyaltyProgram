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
  division?: string;
}): SessionUser {
  const user: SessionUser = {
    id: input.id,
    npk: input.npk,
    name: input.name,
    email: input.email,
    role: input.role,
  };
  if (input.division) {
    user.division = input.division;
  }
  return user;
}

function verifyInternalToken(token: string, secret: string): SessionUser | null {
  if (!token.startsWith("internal.")) {
    return null;
  }

  const [, payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload, secret);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
  if (!isInternalTokenPayload(parsed)) {
    return null;
  }
  
  if (parsed.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const division = toOptionalString(parsed.division);
  return buildSessionUser({
    id: parsed.id,
    npk: parsed.npk,
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
    ...(division ? { division } : {}),
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

    const division = toOptionalString(payload["division"]);
    req.user = buildSessionUser({
      id: toRequiredString(payload["id"]),
      npk: toRequiredString(payload["npk"]),
      name: toRequiredString(payload["name"]),
      email: toRequiredString(payload["email"]),
      role,
      ...(division ? { division } : {}),
    });
    next();
  } catch {
    console.warn("[Auth] Authentication failed");
    res.status(401).json({ error: "Authentication failed" });
  }
};
