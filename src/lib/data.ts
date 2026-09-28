import "server-only";
import { cache } from "react";
import { restaurants as placeholder } from "@/data/restaurants";
import { getServerClient } from "./supabase/client";
import { normalizeStats, rowToRestaurant } from "./supabase/database";
import type { Restaurant, RestaurantStats } from "./types";

/** Seconds a cached copy of restaurant data is served before refetching. */
export const REVALIDATE_SECONDS = 300;

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
