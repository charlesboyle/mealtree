import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuPage } from "@/components/menu/menu-page";
import { getRestaurant, restaurants } from "@/data/restaurants";
import { photoUrl, priceLevelLabel } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

export function generateStaticParams() {
  return restaurants.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(props: PageProps<"/r/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const r = getRestaurant(slug);
  if (!r) return {};
  const title = `${r.name} menu & prices`;
  const description = `${r.tagline} See the full ${r.name} menu with prices${r.cover ? " and photos" : ""} — ${r.neighborhood}.`;
  return {
    title,
    description,
    alternates: { canonical: `/r/${r.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: r.cover ? [{ url: photoUrl(r.cover, 1200), width: 1200 }] : undefined,
    },
  };
}

/** schema.org Restaurant + Menu so search engines can show dishes and prices. */
function jsonLd(r: Restaurant) {
  const dayCodes = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    description: r.tagline,
    servesCuisine: r.cuisine,
    priceRange: priceLevelLabel(r.priceLevel),
    telephone: r.phone,
    address: { "@type": "PostalAddress", streetAddress: r.address },
    image: r.cover ? photoUrl(r.cover, 1200) : undefined,
    openingHours: Object.entries(r.hours).flatMap(([d, ranges]) =>
      ranges.map(([o, c]) => `${dayCodes[Number(d)]} ${o}-${c}`),
    ),
    hasMenu: r.menus.map((m) => ({
      "@type": "Menu",
      name: m.name,
      hasMenuSection: m.sections.map((s) => ({
        "@type": "MenuSection",
        name: s.name,
        hasMenuItem: s.items.map((i) => ({
          "@type": "MenuItem",
          name: i.name,
          description: i.description,
          image: i.image ? photoUrl(i.image, 800) : undefined,
          offers:
            i.price === null
              ? undefined
              : { "@type": "Offer", price: i.price.toFixed(2), priceCurrency: "USD" },
        })),
      })),
    })),
  };
}

export default async function RestaurantPage(props: PageProps<"/r/[slug]">) {
  const { slug } = await props.params;
  const r = getRestaurant(slug);
  if (!r) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(r)).replace(/</g, "\\u003c") }}
      />
      <MenuPage restaurant={r} />
    </>
  );
}
