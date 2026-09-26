import type { Metadata } from "next";
import { FindRestaurant } from "@/components/claim/find-restaurant";
import { listRestaurants } from "@/lib/data";

export const metadata: Metadata = { title: "For restaurants" };

// Refresh restaurant data from Supabase every 5 minutes (matches REVALIDATE_SECONDS).
export const revalidate = 300;

export default async function ClaimIndex() {
  return <FindRestaurant restaurants={await listRestaurants()} />;
}
