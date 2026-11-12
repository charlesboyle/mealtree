import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { restaurants as placeholder } from "@/data/restaurants";
import { restaurantMoods } from "./moods";
import { getServerClient } from "./supabase/client";
import { normalizeStats, rowToRestaurant } from "./supabase/database";
import type { MenuItem, Restaurant, RestaurantStats } from "./types";

/**
 * Seconds a cached copy of restaurant data is served before refetching. Admin
 * edits in /ops refresh pages at once (`updateTag("mealtree")`), so this only
 * bounds how long a script import or a direct DB change takes to show.
 * Page files repeat it as a literal `export const revalidate`.
 */
export const REVALIDATE_SECONDS = 3600;

/**
 * All restaurants, ordered by name. Reads Supabase when configured (and fails
 * loudly if it can't, so a deploy never silently serves placeholder menus);
 * otherwise returns the bundled placeholder data.
 */
export const listRestaurants = cache(async (): Promise<Restaurant[]> => {
  const db = getServerClient(REVALIDATE_SECONDS);
  if (!db) return placeholder;
  const { data, error } = await db.from("restaurants").select("*").order("name");
  if (error) throw new Error(`Failed to load restaurants: ${error.message}`);
  return data.map(rowToRestaurant);
});

/** Dishes the list pages feature: popular ("Known for", Popular row), spicy and vegetarian rows. */
const featured = (i: MenuItem) =>
  Boolean(i.popular || i.tags?.some((t) => t === "spicy" || t === "vegetarian" || t === "vegan"));

/**
 * A restaurant for cards and lists: everything but the full menu. Its menus keep
 * only featured dishes (in menu order) and every section name, and `moods` is
 * worked out here from the whole menu, so lists render the same as before.
 */
export function toCard(r: Restaurant): Restaurant {
  return {
    ...r,
    moods: restaurantMoods(r),
    menuFiles: undefined,
    menus: r.menus.map((m) => ({ ...m, sections: m.sections.map((s) => ({ ...s, items: s.items.filter(featured) })) })),
  };
}

/**
 * All restaurants as cards, ordered by name. The full table is over 2 MB, which
 * Next's data cache refuses, so every render refetched it; the cards are about
 * a tenth of that and are cached as one entry. Use this for anything that
 * lists restaurants; use `findRestaurant` for a full menu.
 */
export const listRestaurantCards = cache(
  unstable_cache(async () => (await listRestaurants()).map(toCard), ["restaurant-cards-v2"], {
    revalidate: REVALIDATE_SECONDS,
    tags: ["mealtree"],
  }),
);

export const findRestaurant = cache(async (slug: string): Promise<Restaurant | undefined> => {
  const db = getServerClient(REVALIDATE_SECONDS);
  if (!db) return placeholder.find((r) => r.slug === slug);
  const { data, error } = await db.from("restaurants").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to load restaurant ${slug}: ${error.message}`);
  return data ? rowToRestaurant(data) : undefined;
});

/**
 * Last-30-day stats for a published restaurant, cached like the rest of the
 * data. The owner dashboard refreshes them in the browser (`useStats`).
 */
export const getStats = cache(async (slug: string): Promise<RestaurantStats> => {
  const db = getServerClient(REVALIDATE_SECONDS);
  if (!db) return normalizeStats(null);
  const { data, error } = await db.rpc("restaurant_stats", { p_slug: slug });
  if (error) throw new Error(`Failed to load stats for ${slug}: ${error.message}`);
  return normalizeStats(data);
});
