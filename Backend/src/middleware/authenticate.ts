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
import { hkdf } from "node:crypto";
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
    if (!derivedKey) {
      derivedKey = await getDerivedEncryptionKey(secret);
    }

    // Decrypt JWE token
    const { payload } = await jwtDecrypt(token, derivedKey, {
      clockTolerance: 15, // 15 seconds tolerance
    });

    if (!payload || !payload["user"]) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    req.user = payload["user"] as unknown as SessionUser;
    next();
  } catch (err) {
    console.error("[Auth] Authentication failed:", err);
    res.status(401).json({ error: "Authentication failed" });
  }
};
