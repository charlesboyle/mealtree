import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database";

export type MealtreeClient = SupabaseClient<Database, "mealtree">;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Without env vars the app runs on bundled placeholder data and localStorage. */
export const supabaseConfigured = Boolean(url && key);

let browserClient: MealtreeClient | null = null;

/** Browser client for public reads and owner RPCs. */
export function getBrowserClient(): MealtreeClient | null {
  if (!supabaseConfigured) return null;
  browserClient ??= createClient<Database, "mealtree">(url!, key!, {
    db: { schema: "mealtree" },
    // Owners are identified by a claim token, not Supabase Auth sessions.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return browserClient;
}

/** Server client whose requests use Next's data cache (ISR). */
export function getServerClient(revalidate: number): MealtreeClient | null {
  if (!supabaseConfigured) return null;
  return createClient<Database, "mealtree">(url!, key!, {
    db: { schema: "mealtree" },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate, tags: ["mealtree"] } }),
    },
  });
}
