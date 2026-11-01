"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "nomm:saved";
const listeners = new Set<() => void>();
const EMPTY: string[] = [];
let cache: { raw: string | null; slugs: string[] } = { raw: null, slugs: EMPTY };

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.slugs;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const slugs = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : EMPTY;
    cache = { raw, slugs };
    return slugs;
  } catch {
    return EMPTY;
  }
}

function write(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {
    // Storage unavailable (private mode): saving silently does nothing.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Restaurants the diner hearted, kept in this browser only. */
export function useSaved() {
  const slugs = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((slug: string) => {
    const cur = read();
    write(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
  }, []);
  return { slugs, isSaved: (slug: string) => slugs.includes(slug), toggle };
}
