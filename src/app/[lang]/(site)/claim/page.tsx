import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FindRestaurant } from "@/components/claim/find-restaurant";
import { getI18n } from "@/i18n/server";
import { listRestaurantCards } from "@/lib/data";
import { CLAIM_FLOW_ENABLED } from "@/lib/flags";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.forRestaurants, robots: NO_INDEX };
}

// Refresh restaurant data from Supabase every hour (matches REVALIDATE_SECONDS).
export const revalidate = 3600;

export default async function ClaimIndex() {
  // Claiming is paused (see lib/flags.ts): the owner form on /for-restaurants takes its place.
  if (!CLAIM_FLOW_ENABLED) redirect((await getI18n()).href("/for-restaurants?claim=1#interest"));
  return (
    <FindRestaurant restaurants={await listRestaurantCards()} />
  );
}
