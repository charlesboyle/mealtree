"use client";

import { useEffect, useState } from "react";
import type { IndexedRestaurant } from "@/lib/search-index";

let cached: IndexedRestaurant[] | null = null;

/** Loads the slim restaurant index the first time the phone search sheet opens. */
export function useSearchIndex(enabled: boolean) {
  const [index, setIndex] = useState<IndexedRestaurant[]>(cached ?? []);
  useEffect(() => {
    if (!enabled || cached) return;
    let live = true;
    fetch("/api/search-index")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: IndexedRestaurant[]) => {
        cached = data;
        if (live) setIndex(data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [enabled]);
  return index;
}
