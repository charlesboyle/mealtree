#!/usr/bin/env node
/**
 * Uploads the pages made by prepare-menu-files.py to the public `menus` Storage bucket and records
 * them on the restaurant (menu_files). Uploads are authorised by the admin token header (checked
 * in the database), so no service_role key is needed.
 *
 * Usage: node scripts/upload-menu-files.mjs <out_dir> [slug …]   (no slugs = every folder in out_dir)
 * Reads NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY from .env and MEALTREE_ADMIN_TOKEN from .env.local.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

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

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, MEALTREE_ADMIN_TOKEN: token } = process.env;
const [dir, ...only] = process.argv.slice(2);
if (!dir || !(url && key && token)) throw new Error("Usage: upload-menu-files.mjs <out_dir> [slug…] (needs Supabase env + MEALTREE_ADMIN_TOKEN)");

const slugs = only.length ? only : readdirSync(dir).filter((d) => existsSync(join(dir, d, "files.json")));
for (const slug of slugs) {
  const manifest = JSON.parse(readFileSync(join(dir, slug, "files.json"), "utf8"));
  for (const f of manifest.files) {
    const res = await fetch(`${url}/storage/v1/object/menus/${f.path}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "x-admin-token": token, "x-upsert": "true", "Content-Type": "image/jpeg" },
      body: readFileSync(join(dir, f.path)),
    });
    if (!res.ok) throw new Error(`upload ${f.path}: ${res.status} ${(await res.text()).slice(0, 160)}`);
  }
  const res = await fetch(`${url}/rest/v1/rpc/admin_set_menu_files`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Content-Profile": "mealtree" },
    body: JSON.stringify({ p_token: token, p_slug: slug, p_data: manifest }),
  });
  const body = await res.text();
  console.log(res.ok && JSON.parse(body) ? `ok   ${slug} (${manifest.files.length} pages, received ${manifest.received})` : `FAIL ${slug}: ${res.status} ${body.slice(0, 160)}`);
}
