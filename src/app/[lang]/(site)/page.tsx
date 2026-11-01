import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverPage } from "@/components/discover/discover-page";
import { getI18n } from "@/i18n/server";
import { listRestaurants } from "@/lib/data";
import { pageAlternates } from "@/lib/seo";

// Refresh restaurant data from Supabase every 5 minutes (matches REVALIDATE_SECONDS).
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: pageAlternates((await getI18n()).locale, "") };
}

export default async function Home() {
  return (
    <Suspense>
      <DiscoverPage restaurants={await listRestaurants()} />
    </Suspense>
  );
}
