"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getBrowserClient } from "./supabase/client";

/**
 * Live owner state for one restaurant: claim status and per-dish edits.
 *
 * With Supabase configured, public reads come from `mealtree.item_overrides`
 * and writes go through the owner RPCs, authorized by the claim token kept in
 * this browser. Without it, everything lives in localStorage so the demo loop
 * (claim → edit → see it on the menu) still works offline.
 */
export type Overrides = {
  /** False until the first load finishes (or immediately in local mode). */
  ready: boolean;
  claimed: boolean;
  /** This browser holds the owner token for the restaurant. */
  isOwner: boolean;
  ownerName?: string;
  googleOptIn?: boolean;
  soldOut: Record<string, boolean>;
  price: Record<string, number>;
};

export type ClaimInput = {
  name: string;
  role: string;
  method: "phone" | "email" | "google";
  googleOptIn: boolean;
};

const EMPTY: Overrides = { ready: false, claimed: false, isOwner: false, soldOut: {}, price: {} };

const localKey = (slug: string) => `mealtree:overrides:${slug}`;
const tokenKey = (slug: string) => `mealtree:owner-token:${slug}`;

const state = new Map<string, Overrides>();
const loading = new Set<string>();
const listeners = new Set<() => void>();

function storageGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}

function emit(slug: string, next: Overrides) {
  state.set(slug, next);
  if (!getBrowserClient()) {
    const { claimed, ownerName, googleOptIn, soldOut, price } = next;
    storageSet(localKey(slug), JSON.stringify({ claimed, ownerName, googleOptIn, soldOut, price }));
  }
  listeners.forEach((l) => l());
}

function readLocal(slug: string): Overrides {
  let saved: Partial<Overrides> = {};
  try {
    saved = JSON.parse(storageGet(localKey(slug)) ?? "{}");
  } catch {}
  const claimed = !!saved.claimed;
  return { ...EMPTY, ...saved, soldOut: saved.soldOut ?? {}, price: saved.price ?? {}, ready: true, claimed, isOwner: claimed };
}

async function loadRemote(slug: string) {
  const db = getBrowserClient()!;
  const token = storageGet(tokenKey(slug));
  const [restaurant, overrides, session] = await Promise.all([
    db.from("restaurants").select("claimed_at").eq("slug", slug).maybeSingle(),
    db.from("item_overrides").select("item_id, sold_out, price, restaurants!inner(slug)").eq("restaurants.slug", slug),
    token ? db.rpc("owner_session", { p_token: token, p_slug: slug }) : Promise.resolve(null),
  ]);
  if (restaurant.error) throw restaurant.error;
  if (overrides.error) throw overrides.error;

  const soldOut: Record<string, boolean> = {};
  const price: Record<string, number> = {};
  for (const row of overrides.data) {
    if (row.sold_out !== null) soldOut[row.item_id] = row.sold_out;
    if (row.price !== null) price[row.item_id] = Number(row.price);
  }
  const owner = session && !session.error ? session.data?.[0] : undefined;
  // A token the server no longer accepts (e.g. data was reset) is useless.
  if (token && session?.error) storageSet(tokenKey(slug), null);

  return {
    ready: true,
    claimed: restaurant.data?.claimed_at != null,
    isOwner: !!owner,
    ownerName: owner?.name,
    googleOptIn: owner?.google_opt_in,
    soldOut,
    price,
  } satisfies Overrides;
}

function ensureLoaded(slug: string) {
  if (state.has(slug) || loading.has(slug)) return;
  if (!getBrowserClient()) {
    emit(slug, readLocal(slug));
    return;
  }
  loading.add(slug);
  loadRemote(slug)
    .then((next) => emit(slug, next))
    .catch((e) => {
      console.error("Failed to load menu edits", e);
      emit(slug, { ...EMPTY, ready: true });
    })
    .finally(() => loading.delete(slug));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key?.startsWith("mealtree:") && (state.clear(), cb());
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useOverrides(slug: string): Overrides {
  useEffect(() => ensureLoaded(slug), [slug]);
  return useSyncExternalStore(
    subscribe,
    () => state.get(slug) ?? EMPTY,
    () => EMPTY,
  );
}

/** Optimistically apply `patch`, run `remote`, and roll back if it fails. */
async function mutate(slug: string, patch: (o: Overrides) => Overrides, remote?: (token: string) => PromiseLike<{ error: unknown }>) {
  const before = state.get(slug) ?? readLocal(slug);
  emit(slug, patch(before));
  const db = getBrowserClient();
  if (!db || !remote) return;
  const token = storageGet(tokenKey(slug));
  if (!token) {
    emit(slug, before);
    throw new Error("Only the verified owner can edit this menu.");
  }
  const { error } = await remote(token);
  if (error) {
    emit(slug, before);
    throw error instanceof Error ? error : new Error(String((error as { message?: string }).message ?? error));
  }
}

export const menuActions = {
  async claim(slug: string, input: ClaimInput) {
    const db = getBrowserClient();
    if (db) {
      const { data, error } = await db.rpc("claim_restaurant", {
        p_slug: slug,
        p_name: input.name,
        p_role: input.role,
        p_method: input.method,
        p_google_opt_in: input.googleOptIn,
      });
      if (error) throw new Error(error.message === "already_claimed" ? "This restaurant was already claimed." : error.message);
      storageSet(tokenKey(slug), data);
    }
    const before = state.get(slug) ?? (db ? { ...EMPTY, ready: true } : readLocal(slug));
    emit(slug, { ...before, ready: true, claimed: true, isOwner: true, ownerName: input.name, googleOptIn: input.googleOptIn });
  },

  setSoldOut(slug: string, itemId: string, soldOut: boolean) {
    return mutate(
      slug,
      (o) => ({ ...o, soldOut: { ...o.soldOut, [itemId]: soldOut } }),
      (t) => getBrowserClient()!.rpc("set_item_override", { p_token: t, p_slug: slug, p_item_id: itemId, p_sold_out: soldOut }),
    );
  },

  setPrice(slug: string, itemId: string, price: number) {
    return mutate(
      slug,
      (o) => ({ ...o, price: { ...o.price, [itemId]: price } }),
      (t) => getBrowserClient()!.rpc("set_item_override", { p_token: t, p_slug: slug, p_item_id: itemId, p_price: price }),
    );
  },

  reset(slug: string) {
    return mutate(
      slug,
      (o) => ({ ...o, soldOut: {}, price: {} }),
      (t) => getBrowserClient()!.rpc("reset_overrides", { p_token: t, p_slug: slug }),
    );
  },

  requestGoogleLink(slug: string) {
    return mutate(
      slug,
      (o) => ({ ...o, googleOptIn: true }),
      (t) => getBrowserClient()!.rpc("request_google_link", { p_token: t, p_slug: slug }),
    );
  },
};

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
