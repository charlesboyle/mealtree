import type { Metadata } from "next";
import { Suspense } from "react";
import { MapPage } from "@/components/map/map-page";
import { getI18n } from "@/i18n/server";
import { listRestaurantCards } from "@/lib/data";
import { pageAlternates, social } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { title: t.map.title, ...social(locale, `${t.map.title} · NOMM`, t.meta.description), alternates: pageAlternates(locale, "/map") };
}

export default async function MapRoute() {
  return (
    <Suspense>
      <MapPage restaurants={await listRestaurantCards()} />
    </Suspense>
  );
}
