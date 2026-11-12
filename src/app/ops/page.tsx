import type { Metadata } from "next";
import { OpsBoard, type MenuSubmissions } from "@/components/ops/ops-board";
import { adminDb, adminStorage, requireAdmin } from "@/lib/admin/server";
import { MENU_BUCKET } from "@/lib/menu-bucket";
import { normalizeStats } from "@/lib/supabase/database";

export const metadata: Metadata = { title: "Ops", robots: { index: false } };

// Admin data is per-request and never cached.
export const dynamic = "force-dynamic";

/** Signed links stay valid this long; reload /ops for fresh ones. */
const LINK_SECONDS = 60 * 60;

export default async function OpsPage() {
  const token = await requireAdmin();
  const db = adminDb();
  const [{ data, error }, menus] = await Promise.all([db.rpc("admin_overview", { p_token: token }), loadMenuSubmissions(token)]);
  if (error || !data) throw new Error(`Couldn't load ops data: ${error?.message ?? "empty response"}`);
  const overview = { ...data, restaurants: data.restaurants.map((r) => ({ ...r, stats: normalizeStats(r.stats) })) };
  return <OpsBoard overview={overview} menus={menus} />;
}

/**
 * Owner menu submissions with signed open/download links for their files. Kept apart from admin_overview and
 * never fatal: before the menu_submissions migration is applied, the view just says so.
 */
async function loadMenuSubmissions(token: string): Promise<MenuSubmissions> {
  const { data, error } = await adminDb().rpc("admin_menu_submissions", { p_token: token });
  if (error || !data) return { ok: false, error: error?.message ?? "empty response" };
  const open = data.filter((s) => s.status === "new" || s.status === "in_progress");
  const paths = open.flatMap((s) => s.file_paths);
  const links = new Map<string, { view: string | null; download: string | null }>();
  if (paths.length) {
    const bucket = adminStorage(token).from(MENU_BUCKET);
    const [view, download] = await Promise.all([
      bucket.createSignedUrls(paths, LINK_SECONDS),
      bucket.createSignedUrls(paths, LINK_SECONDS, { download: true }),
    ]);
    for (const p of paths) links.set(p, { view: null, download: null });
    for (const v of view.data ?? []) if (v.path && !v.error) links.get(v.path)!.view = v.signedUrl;
    for (const d of download.data ?? []) if (d.path && !d.error) links.get(d.path)!.download = d.signedUrl;
  }
  return {
    ok: true,
    rows: data.map((s) => ({
      ...s,
      files: s.file_paths.map((path) => ({ path, ...(links.get(path) ?? { view: null, download: null }) })),
    })),
  };
}
