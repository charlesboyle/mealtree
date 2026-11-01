import type { Metadata } from "next";
import { FindRestaurant } from "@/components/claim/find-restaurant";
import { getI18n } from "@/i18n/server";
import { listRestaurants } from "@/lib/data";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.forRestaurants, robots: NO_INDEX };
}

// Refresh restaurant data from Supabase every 5 minutes (matches REVALIDATE_SECONDS).
export const revalidate = 300;

export default async function ClaimIndex() {
  return (
    <FindRestaurant restaurants={await listRestaurants()} />
  );
}
