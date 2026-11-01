#!/usr/bin/env node
/**
 * Loads rating + rating count into mealtree.restaurants through the token-checked
 * `admin_set_ratings` function. Rows are matched to restaurants by name.
 *
 * Usage: node scripts/import-ratings.mjs [--dry] venues.csv prepared1.json prepared2.json …
 *   venues.csv   a CSV with name, rating, reviews columns (e.g. wa-outreach/abu_dhabi_no_website_mobile_venues.csv)
 *   prepared*.json   the db_ready rows, which give the slug for each name
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
const [csvFile, ...rowFiles] = args.filter((a) => !a.startsWith("--"));
if (!csvFile || !rowFiles.length) throw new Error("Pass a venues CSV and at least one prepared JSON file.");

/** Minimal CSV parser: quoted fields, doubled quotes, newlines inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") (row.push(field), (field = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0]) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) (row.push(field), rows.push(row));
  return rows;
}

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const [header, ...body] = parseCsv(readFileSync(csvFile, "utf8"));
const col = (name) => header.indexOf(name);
const byName = new Map(body.map((r) => [norm(r[col("name")] ?? ""), r]));

const out = [];
for (const file of rowFiles) {
  const row = JSON.parse(readFileSync(file, "utf8"));
  if (!row.slug || !row.name) continue;
  const hit = byName.get(norm(row.name));
  const rating = Number(hit?.[col("rating")]);
  const count = Number(hit?.[col("reviews")] || 0);
  if (!hit || !rating) {
    console.log(`skip ${row.slug}: ${hit ? "no rating" : "no matching venue"}`);
    continue;
  }
  out.push({ slug: row.slug, rating, count });
  console.log(`${row.slug}: ${rating} (${count})`);
}

if (dry || !out.length) process.exit(0);
const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, MEALTREE_ADMIN_TOKEN: token } = process.env;
if (!(url && key && token)) throw new Error("Missing Supabase URL/key or MEALTREE_ADMIN_TOKEN (.env / .env.local).");
const res = await fetch(`${url}/rest/v1/rpc/admin_set_ratings`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Content-Profile": "mealtree" },
  body: JSON.stringify({ p_token: token, p_data: out }),
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log(`updated ${await res.json()} restaurants`);
