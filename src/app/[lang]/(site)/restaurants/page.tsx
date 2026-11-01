import type { Metadata } from "next";
import { Suspense } from "react";
import { RestaurantsPage } from "@/components/discover/restaurants-page";
import { getI18n } from "@/i18n/server";
import { listRestaurants } from "@/lib/data";
import { pageAlternates } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { title: t.site.list.title, alternates: pageAlternates(locale, "/restaurants") };
}

export default async function Restaurants() {
  return (
    <Suspense>
      <RestaurantsPage restaurants={await listRestaurants()} />
    </Suspense>
  );
}
