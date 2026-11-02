import { itemMinPrice } from "@/lib/format";
import type { Hours, MenuItem, MenuSection, Restaurant } from "@/lib/types";

export const ALL_AREAS = "all";

/** Distinct neighbourhoods across the given restaurants, with their Arabic names, sorted by English name. */
export function listAreas(restaurants: Restaurant[]) {
  const seen = new Map<string, string | undefined>();
  for (const r of restaurants) {
    if (r.neighborhood && !seen.has(r.neighborhood)) seen.set(r.neighborhood, r.neighborhoodAr);
  }
  return [...seen].map(([name, nameAr]) => ({ name, nameAr })).sort((a, b) => a.name.localeCompare(b.name));
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Serves past 23:00 or past midnight on some day of the week. */
export function opensLate(hours: Hours) {
  return Object.values(hours).some((spans) =>
    spans.some(([open, close]) => toMin(close) <= toMin(open) || toMin(close) >= 23 * 60),
  );
}

/** Name with case, accents, punctuation, bracketed notes and spacing ignored, so "Mango Sticky Rice (Large)" matches "mango sticky rice". */
function dishKey(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export type DishPick = { restaurant: Restaurant; item: MenuItem; section: MenuSection };

/**
 * Dishes matching `test`, one restaurant at a time in turn so a single big menu
 * can't fill the row. Sold-out and unpriced dishes are skipped, and dishes with a photo come first.
 * The same dish served by several restaurants (or branches) appears once: the first in line keeps the spot.
 */
export function pickDishes(restaurants: Restaurant[], test: (item: MenuItem) => boolean, limit = 12): DishPick[] {
  const lists = restaurants.map((restaurant) =>
    restaurant.menus.flatMap((m) =>
      m.sections.flatMap((section) =>
        section.items
          .filter((item) => !item.soldOut && itemMinPrice(item) !== null && test(item))
          .map((item) => ({ restaurant, item, section })),
      ),
    ).sort((a, b) => Number(Boolean(b.item.image)) - Number(Boolean(a.item.image))),
  );
  const out: DishPick[] = [];
  const seen = new Set<string>();
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest && out.length < limit; i++) {
    for (const list of lists) {
      const pick = list[i];
      if (!pick || out.length >= limit) continue;
      const key = dishKey(pick.item.name);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(pick);
    }
  }
  return out;
}

/** Names of up to `count` popular dishes, for "Known for …" lines. */
export function knownFor(r: Restaurant, count = 2) {
  return r.menus
    .flatMap((m) => m.sections.flatMap((s) => s.items))
    .filter((i) => i.popular)
    .slice(0, count);
}
