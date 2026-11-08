"use client";

import { useEffect, useMemo, useState } from "react";
import type { Menu, Restaurant } from "@/lib/types";

/**
 * Swaps in the full menus of the given restaurants (list pages ship trimmed
 * ones, see `toCard`). Until they load, restaurants keep their trimmed menus.
 */
export function useFullMenus(restaurants: Restaurant[], slugs: string[]) {
  const [loaded, setLoaded] = useState<Map<string, Menu[]>>(new Map());
  const key = [...slugs].sort().join(",");

  useEffect(() => {
    const missing = key ? key.split(",").filter((s) => !loaded.has(s)) : [];
    if (!missing.length) return;
    let live = true;
    const qs = new URLSearchParams(missing.map((s) => ["slug", s]));
    fetch(`/api/menus?${qs}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: { slug: string; menus: Menu[] }[]) => {
        if (!live || !rows.length) return;
        setLoaded((prev) => new Map([...prev, ...rows.map((r) => [r.slug, r.menus] as const)]));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key, loaded]);

  return useMemo(
    () => (loaded.size ? restaurants.map((r) => (loaded.has(r.slug) ? { ...r, menus: loaded.get(r.slug)! } : r)) : restaurants),
    [restaurants, loaded],
  );
}
