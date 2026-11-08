import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuPage } from "@/components/menu/menu-page";
import { getI18n } from "@/i18n/server";
import { pageAlternates, social } from "@/lib/seo";
import { findRestaurant, listRestaurantCards } from "@/lib/data";
import { photoUrl } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

// Refresh restaurant data from Supabase every hour (matches REVALIDATE_SECONDS).
export const revalidate = 3600;

// Not prerendered at build: each deploy would rewrite every menu page (ISR writes on the Hobby plan).
// A page renders on its first visit, then is cached and refreshed hourly like the rest.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: PageProps<"/[lang]/r/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const [r, i18n] = await Promise.all([findRestaurant(slug), getI18n()]);
  if (!r) return {};
  const { t, pick } = i18n;
  const name = pick(r.name, r.nameAr);
  const title = t.meta.menuTitle(name);
  const description = t.meta.menuDescription(pick(r.tagline, r.taglineAr), name, pick(r.neighborhood, r.neighborhoodAr));
  return {
    title,
    description,
    alternates: pageAlternates(i18n.locale, `/r/${r.slug}`),
    ...social(i18n.locale, `${title} · NOMM`, description, r.cover ? [{ url: photoUrl(r.cover, 1200), width: 1200 }] : undefined),
  };
}

/** schema.org Restaurant + Menu so search engines can show dishes and prices. */
function jsonLd(r: Restaurant, i18n: Awaited<ReturnType<typeof getI18n>>) {
  const { pick } = i18n;
  const dayCodes = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const hours = Object.entries(r.hours).flatMap(([d, ranges]) => ranges.map(([o, c]) => `${dayCodes[Number(d)]} ${o}-${c}`));
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: pick(r.name, r.nameAr),
    alternateName: i18n.alt(r.name, r.nameAr),
    description: pick(r.tagline, r.taglineAr) || undefined,
    inLanguage: i18n.locale,
    servesCuisine: r.cuisine.length ? r.cuisine.map(i18n.cuisine) : undefined,
    priceRange: r.priceLevel > 0 ? "$".repeat(r.priceLevel) : undefined,
    currenciesAccepted: r.currency,
    telephone: r.phone || undefined,
    address: { "@type": "PostalAddress", streetAddress: pick(r.address, r.addressAr), addressCountry: "AE" },
    image: r.cover ? photoUrl(r.cover, 1200) : undefined,
    openingHours: hours.length ? hours : undefined,
    hasMenu: r.menus.map((m) => ({
      "@type": "Menu",
      name: pick(m.name, m.nameAr),
      hasMenuSection: m.sections.map((s) => ({
        "@type": "MenuSection",
        name: pick(s.name, s.nameAr),
        hasMenuItem: s.items.map((i) => ({
          "@type": "MenuItem",
          name: pick(i.name, i.nameAr),
          description: i.description ? pick(i.description, i.descriptionAr) : undefined,
          image: i.image ? photoUrl(i.image, 800) : undefined,
          offers:
            i.price === null ? undefined : { "@type": "Offer", price: i.price.toFixed(2), priceCurrency: r.currency },
        })),
      })),
    })),
  };
}

export default async function RestaurantPage(props: PageProps<"/[lang]/r/[slug]">) {
  const { slug } = await props.params;
  const [r, i18n] = await Promise.all([findRestaurant(slug), getI18n()]);
  if (!r) notFound();
  // Other places to suggest, without their menus (they would all ship to the browser).
  const more = (await listRestaurantCards())
    .filter((o) => o.slug !== r.slug)
    .map((o) => ({
      o,
      score: o.cuisine.filter((c) => r.cuisine.includes(c)).length * 2 + (o.neighborhood === r.neighborhood ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || (b.o.rating ?? 0) - (a.o.rating ?? 0))
    .slice(0, 8)
    .map(({ o }) => ({ ...o, menus: [] }));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(r, i18n)).replace(/</g, "\\u003c") }}
      />
      
        <MenuPage restaurant={r} more={more} />
      
    </>
  );
}
