#!/usr/bin/env node
/**
 * Upserts prepared restaurant rows (see prepare-menu.py) through the token-checked
 * `admin_upsert_restaurant` function. It only ever touches mealtree.restaurants; it
 * never needs the service_role key.
 *
 * Usage: node scripts/import-restaurants.mjs [--dry] row1.json row2.json …
 * Reads NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY from .env and MEALTREE_ADMIN_TOKEN from .env.local.
 */
import { readFileSync } from "node:fs";

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv(".env.local");
loadEnv(".env");

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const files = args.filter((a) => !a.startsWith("--"));
const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, MEALTREE_ADMIN_TOKEN: token } = process.env;
if (!files.length) throw new Error("Pass at least one prepared JSON file.");
if (!dry && !(url && key && token)) throw new Error("Missing Supabase URL/key or MEALTREE_ADMIN_TOKEN (.env / .env.local).");

for (const file of files) {
  const row = JSON.parse(readFileSync(file, "utf8"));
  const dishes = row.menus.flatMap((m) => m.sections.flatMap((s) => s.items)).length;
  if (dry) {
    console.log(`[dry] ${row.slug}: ${dishes} dishes, published=${row.published}`);
    continue;
  }
  const res = await fetch(`${url}/rest/v1/rpc/admin_upsert_restaurant`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Content-Profile": "mealtree" },
    body: JSON.stringify({ p_token: token, p_data: row }),
  });
  const body = await res.text();
  console.log(res.ok ? `ok   ${row.slug} (${dishes} dishes)` : `FAIL ${row.slug}: ${res.status} ${body.slice(0, 200)}`);
  if (!res.ok) process.exitCode = 1;
}
