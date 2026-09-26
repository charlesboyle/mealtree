import type { Metadata } from "next";
import { OpsBoard } from "@/components/ops/ops-board";
import { adminDb, requireAdmin } from "@/lib/admin/server";
import { normalizeStats } from "@/lib/supabase/database";

export const metadata: Metadata = { title: "Ops", robots: { index: false } };

// Admin data is per-request and never cached.
export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const token = await requireAdmin();
  const { data, error } = await adminDb().rpc("admin_overview", { p_token: token });
  if (error || !data) throw new Error(`Couldn't load ops data: ${error?.message ?? "empty response"}`);
  const overview = { ...data, restaurants: data.restaurants.map((r) => ({ ...r, stats: normalizeStats(r.stats) })) };
  return <OpsBoard overview={overview} />;
}
