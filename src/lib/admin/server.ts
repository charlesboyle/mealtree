import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database";
import { ADMIN_COOKIE, adminToken, verifySessionValue } from "./session";

export async function isAdmin() {
  const jar = await cookies();
  return verifySessionValue(jar.get(ADMIN_COOKIE)?.value, adminToken());
}

/** Page/action guard. The proxy already gates /ops; this is defense in depth. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/ops/login");
  return adminToken()!;
}

/**
 * Client for admin RPCs. Uses the publishable key: every admin function
 * checks the token itself, so no service-role key is needed on the server.
 */
export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase isn't configured.");
  return createClient<Database, "mealtree">(url, key, {
    db: { schema: "mealtree" },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

/**
 * Storage client that sends the admin token as `x-admin-token`, which the private `owner-menus` bucket's
 * admin-only SELECT policy checks (mealtree.is_admin_request), so the ops page can sign links to owners' files.
 */
export function adminStorage(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase isn't configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "x-admin-token": token }, fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  }).storage;
}
