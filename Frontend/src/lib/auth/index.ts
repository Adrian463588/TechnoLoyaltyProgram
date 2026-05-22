/**
 * Auth.js exports — import { auth, signIn, signOut, handlers } from "@/lib/auth"
 */
import { createHmac } from "node:crypto";
import { auth } from "./config";

export { auth, handlers, signIn, signOut } from "./config";

function base64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function getServerToken(): Promise<string> {
  const session = await auth();
  const secret = process.env["NEXTAUTH_SECRET"];

  if (!session?.user || !secret) {
    console.error("[getServerToken] Missing session.user or secret", { hasUser: !!session?.user, hasSecret: !!secret });
    return "";
  }

  console.log("[getServerToken] session.user is:", JSON.stringify(session.user));

  const payload = base64Url(JSON.stringify({
    id: session.user.id,
    npk: session.user.npk,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    divisionId: session.user.divisionId,
    exp: Math.floor(Date.now() / 1000) + 5 * 60,
  }));

  return `internal.${payload}.${signPayload(payload, secret)}`;
}
