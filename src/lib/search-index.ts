import { normalize } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

/** The slim record the phone search sheet matches against; no prices or descriptions. */
export type IndexedRestaurant = {
  slug: string;
  name: string;
  nameAr?: string;
  cuisine: string[];
  neighborhood: string;
  neighborhoodAr?: string;
  rating?: number;
  cover?: string;
  dishes: { id: string; name: string; nameAr?: string }[];
};

export function buildSearchIndex(restaurants: Restaurant[]): IndexedRestaurant[] {
  return restaurants.map((r) => ({
    slug: r.slug,
    name: r.name,
    nameAr: r.nameAr,
    cuisine: r.cuisine,
    neighborhood: r.neighborhood,
    neighborhoodAr: r.neighborhoodAr,
    rating: r.rating,
    cover: r.cover,
    dishes: r.menus.flatMap((m) => m.sections.flatMap((s) => s.items.map((i) => ({ id: i.id, name: i.name, nameAr: i.nameAr })))),
  }));
}

/** A restaurant matches by name, cuisine or area; otherwise by one of its dishes. */
export function matchIndexed(r: IndexedRestaurant, raw: string) {
  const q = normalize(raw.trim());
  if (!q) return { restaurant: r };
  const hay = normalize([r.name, r.nameAr, ...r.cuisine, r.neighborhood, r.neighborhoodAr].join(" "));
  if (hay.includes(q)) return { restaurant: r };
  const dish = r.dishes.find((d) => normalize(`${d.name} ${d.nameAr ?? ""}`).includes(q));
  return dish ? { restaurant: r, dish } : null;
}
