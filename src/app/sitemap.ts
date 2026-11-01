import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { listRestaurants } from "@/lib/data";
import { pageAlternates } from "@/lib/seo";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

/** Every public page in both languages, each pointing at its translation. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await listRestaurants();
  const pages: { path: string; lastModified?: Date }[] = [
    { path: "" },
    { path: "/restaurants" },
    { path: "/for-restaurants" },
    { path: "/terms" },
    { path: "/privacy" },
    ...restaurants.map((r) => ({ path: `/r/${r.slug}`, lastModified: new Date(r.verifiedAt) })),
  ];
  return pages.flatMap(({ path, lastModified }) =>
    locales.map((locale) => ({
      url: `${site}/${locale}${path}`,
      lastModified: lastModified && !Number.isNaN(lastModified.getTime()) ? lastModified : undefined,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(pageAlternates(locale, path).languages).map(([l, u]) => [l, `${site}${u}`]),
        ),
      },
    })),
  );
}
