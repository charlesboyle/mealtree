import type { Metadata } from "next";
import { SavedPage } from "@/components/discover/saved-page";
import { getI18n } from "@/i18n/server";
import { listRestaurantCards } from "@/lib/data";
import { NO_INDEX } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.savedPage.title, robots: NO_INDEX };
}

export default async function Saved() {
  return <SavedPage restaurants={await listRestaurantCards()} />;
}
