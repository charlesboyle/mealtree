"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Owner edits for the demo, kept in localStorage until there is a backend.
 * The public menu page reads the same keys, so toggling "sold out" in the
 * dashboard shows up on the menu in the same browser.
 */
export type Overrides = {
  claimed?: boolean;
  ownerName?: string;
  /** Owner agreed to have the menu link added to their Google Business Profile. */
  googleOptIn?: boolean;
  soldOut: Record<string, boolean>;
  price: Record<string, number>;
};

const EMPTY: Overrides = { soldOut: {}, price: {} };
const key = (slug: string) => `mealtree:overrides:${slug}`;
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: Overrides }>();

function read(slug: string): Overrides {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key(slug));
  } catch {
    return EMPTY;
  }
  const hit = cache.get(slug);
  if (hit && hit.raw === raw) return hit.value;
  let value = EMPTY;
  try {
    value = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {}
  cache.set(slug, { raw, value });
  return value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key?.startsWith("mealtree:") && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useOverrides(slug: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => EMPTY,
  );
  const update = useCallback(
    (fn: (o: Overrides) => Overrides) => {
      const next = fn(read(slug));
      try {
        localStorage.setItem(key(slug), JSON.stringify(next));
      } catch {}
      listeners.forEach((l) => l());
    },
    [slug],
  );
  return [value, update] as const;
}

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
