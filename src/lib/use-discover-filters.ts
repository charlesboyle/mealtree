"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ALL_AREAS } from "@/lib/discover";
import { restaurantMoods } from "@/lib/moods";
import { byRating } from "@/lib/rating";
import { buildSearchIndex, matchIndexed } from "@/lib/search-index";
import type { Restaurant } from "@/lib/types";

export type SortKey = "recommended" | "rating";

/** Search, mood, area, open, price and sort, all kept in the URL so a list can be shared and survives a reload. */
export function useDiscoverFilters(restaurants: Restaurant[], isOpen?: (r: Restaurant) => boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const mood = params.get("mood") ?? "all";
  const area = params.get("area") ?? ALL_AREAS;
  const openNow = params.get("open") === "1";
  const priceLevel = Number(params.get("price")) || 0;
  const sort: SortKey = params.get("sort") === "rating" ? "rating" : "recommended";

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const index = useMemo(() => buildSearchIndex(restaurants), [restaurants]);
  const moods = useMemo(() => new Map(restaurants.map((r) => [r.slug, restaurantMoods(r)])), [restaurants]);

  const results = useMemo(() => {
    const bySlug = new Map(restaurants.map((r) => [r.slug, r]));
    const ordered = sort === "rating" ? new Map(byRating(restaurants).map((r, i) => [r.slug, i])) : null;
    const list = index
      .map((r) => matchIndexed(r, query))
      .filter((m) => m !== null)
      .map((m) => ({ restaurant: bySlug.get(m.restaurant.slug)!, dish: "dish" in m ? m.dish : undefined }))
      .filter((m) => area === ALL_AREAS || m.restaurant.neighborhood === area)
      .filter((m) => mood === "all" || moods.get(m.restaurant.slug)?.includes(mood))
      .filter((m) => !openNow || isOpen?.(m.restaurant))
      .filter((m) => !priceLevel || (priceLevel >= 3 ? m.restaurant.priceLevel >= 3 : m.restaurant.priceLevel === priceLevel));
    if (ordered) list.sort((a, b) => ordered.get(a.restaurant.slug)! - ordered.get(b.restaurant.slug)!);
    return list;
  }, [restaurants, index, moods, query, area, mood, openNow, priceLevel, sort, isOpen]);

  const hasFilters = Boolean(query) || area !== ALL_AREAS || mood !== "all" || openNow || priceLevel > 0;

  return {
    query,
    mood,
    area,
    openNow,
    priceLevel,
    sort,
    results,
    moods,
    hasFilters,
    setQuery: (q: string) => update("q", q || null),
    setMood: (id: string) => update("mood", id === "all" ? null : id),
    setArea: (id: string) => update("area", id === ALL_AREAS ? null : id),
    setOpenNow: (value: boolean) => update("open", value ? "1" : null),
    setPriceLevel: (value: number) => update("price", value ? String(value) : null),
    setSort: (value: SortKey) => update("sort", value === "recommended" ? null : value),
    clearAll: () => router.replace(pathname, { scroll: false }),
  };
}
