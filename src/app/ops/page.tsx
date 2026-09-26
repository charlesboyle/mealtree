import type { Metadata } from "next";
import { OpsBoard } from "@/components/ops/ops-board";
import { listRestaurants } from "@/lib/data";

export const metadata: Metadata = { title: "Ops", robots: { index: false } };

// Refresh restaurant data from Supabase every 5 minutes (matches REVALIDATE_SECONDS).
export const revalidate = 300;

export default async function OpsPage() {
  return <OpsBoard restaurants={await listRestaurants()} />;
}
