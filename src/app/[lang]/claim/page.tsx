import type { Metadata } from "next";
import { FindRestaurant } from "@/components/claim/find-restaurant";
import { getI18n } from "@/i18n/server";
import { listRestaurants } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.forRestaurants };
}

// Refresh restaurant data from Supabase every 5 minutes (matches REVALIDATE_SECONDS).
export const revalidate = 300;

export default async function ClaimIndex() {
  return <FindRestaurant restaurants={await listRestaurants()} />;
}
