import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuPage } from "@/components/menu/menu-page";
import { getI18n } from "@/i18n/server";
import { findRestaurant, listRestaurants } from "@/lib/data";
import { photoUrl } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

// Refresh restaurant data from Supabase every 5 minutes (matches REVALIDATE_SECONDS).
export const revalidate = 300;

export async function generateStaticParams() {
  return (await listRestaurants()).map((r) => ({ slug: r.slug }));
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
    alternates: {
      canonical: `/${i18n.locale}/r/${r.slug}`,
      languages: { en: `/en/r/${r.slug}`, ar: `/ar/r/${r.slug}`, "x-default": `/r/${r.slug}` },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: i18n.locale === "ar" ? "ar_AE" : "en_AE",
      images: r.cover ? [{ url: photoUrl(r.cover, 1200), width: 1200 }] : undefined,
    },
  };
}

/** schema.org Restaurant + Menu so search engines can show dishes and prices. */
function jsonLd(r: Restaurant, i18n: Awaited<ReturnType<typeof getI18n>>) {
  const { pick } = i18n;
  const dayCodes = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: pick(r.name, r.nameAr),
    alternateName: i18n.alt(r.name, r.nameAr),
    description: pick(r.tagline, r.taglineAr),
    inLanguage: i18n.locale,
    servesCuisine: r.cuisine.map(i18n.cuisine),
    priceRange: "$".repeat(r.priceLevel),
    currenciesAccepted: r.currency,
    telephone: r.phone,
    address: { "@type": "PostalAddress", streetAddress: pick(r.address, r.addressAr), addressLocality: "Dubai", addressCountry: "AE" },
    image: r.cover ? photoUrl(r.cover, 1200) : undefined,
    openingHours: Object.entries(r.hours).flatMap(([d, ranges]) =>
      ranges.map(([o, c]) => `${dayCodes[Number(d)]} ${o}-${c}`),
    ),
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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(r, i18n)).replace(/</g, "\\u003c") }}
      />
      <MenuPage restaurant={r} />
    </>
  );
}
