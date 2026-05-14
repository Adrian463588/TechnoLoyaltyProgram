/**
 * Auth.js exports — import { auth, signIn, signOut, handlers } from "@/lib/auth"
 */
export { auth, handlers, signIn, signOut } from "./config";
import { cookies } from "next/headers";

export async function getServerToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("authjs.session-token")?.value || 
         cookieStore.get("__Secure-authjs.session-token")?.value || 
         "";
}
