"use client";

/**
 * The order bag. Front end only: one bag per restaurant, kept in this browser's
 * localStorage, and turned into a WhatsApp message the customer sends
 * themselves. Nothing is stored on a server.
 *
 * Only dish ids, option ids and quantities are stored. Names and prices are
 * resolved against the live menu (owner price overrides included) every time,
 * so a stale bag can never show or total an old price.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { I18n } from "@/i18n";
import { normalizePhone } from "./format";
import type { MenuItem, Restaurant } from "./types";

export type Choice = { id: string; label: string; labelAr?: string; price: number };
/** `variant` is pick-one and required (sizes); `addOns` is optional and pick-several. */
export type OptionGroup = { id: "variant" | "addOns"; required: boolean; max: number; choices: Choice[] };
export type Selections = Record<string, string[]>;

/** The menu's variants and add-ons, as option groups. A single variant is just the dish's price. */
export function optionGroups(item: MenuItem): OptionGroup[] {
  const groups: OptionGroup[] = [];
  if (item.variants && item.variants.length > 1) {
    groups.push({
      id: "variant",
      required: true,
      max: 1,
      choices: item.variants.map((v, i) => ({ id: String(i), label: v.label, labelAr: v.labelAr, price: v.price })),
    });
  }
  if (item.addOns?.length) {
    groups.push({
      id: "addOns",
      required: false,
      max: item.addOns.length,
      choices: item.addOns.map((a, i) => ({ id: String(i), label: a.label, labelAr: a.labelAr, price: a.price })),
    });
  }
  return groups;
}

/** A dish can be ordered when it is in stock and has a price to total. */
export function orderable(item: MenuItem) {
  if (item.soldOut) return false;
  return item.price !== null || (item.variants?.length ?? 0) > 1;
}

export function defaultSelections(groups: OptionGroup[]): Selections {
  const out: Selections = {};
  for (const g of groups) out[g.id] = g.required && g.max === 1 ? [g.choices[0].id] : [];
  return out;
}

/** The first required group with nothing chosen. */
export function missingRequired(groups: OptionGroup[], selections: Selections) {
  return groups.find((g) => g.required && !selections[g.id]?.length);
}

/** Chosen choices in group order; null when a stored id no longer exists on the menu. */
function chosen(groups: OptionGroup[], selections: Selections): Choice[] | null {
  const out: Choice[] = [];
  for (const g of groups) {
    for (const id of selections[g.id] ?? []) {
      const c = g.choices.find((x) => x.id === id);
      if (!c) return null;
      out.push(c);
    }
  }
  return out;
}

/** Price of one serving with these choices; null if it can't be priced. */
export function unitPrice(item: MenuItem, groups: OptionGroup[], selections: Selections): number | null {
  const picked = chosen(groups, selections);
  if (!picked) return null;
  const variantGroup = groups.find((g) => g.id === "variant");
  const variant = variantGroup && (selections.variant?.[0] ? variantGroup.choices.find((c) => c.id === selections.variant[0]) : undefined);
  if (variantGroup && !variant) return null;
  const base = variant ? variant.price : item.price;
  if (base === null) return null;
  const extras = picked.filter((c) => c !== variant).reduce((sum, c) => sum + c.price, 0);
  return base + extras;
}

/** Same dish with the same choices stacks into one line. */
export function lineKey(itemId: string, selections: Selections) {
  const parts = Object.keys(selections)
    .sort()
    .filter((g) => selections[g].length > 0)
    .map((g) => `${g}=${[...selections[g]].sort().join(",")}`);
  return parts.length ? `${itemId}|${parts.join(";")}` : itemId;
}

export type ResolvedLine = {
  key: string;
  item: MenuItem;
  qty: number;
  unit: number;
  selections: Selections;
  choices: Choice[];
};

type StoredLine = { key: string; itemId: string; qty: number; sel: Selections };

export const MAX_QTY = 20;
const storageKey = (slug: string) => `nomm:bag:v2:${slug}`;
const listeners = new Set<() => void>();

function read(slug: string) {
  try {
    return localStorage.getItem(storageKey(slug)) ?? "";
  } catch {
    return "";
  }
}

function parse(raw: string): StoredLine[] {
  try {
    const data: unknown = raw ? JSON.parse(raw) : null;
    const lines = (data as { lines?: unknown } | null)?.lines;
    if (!Array.isArray(lines)) return [];
    return lines.filter(
      (l): l is StoredLine =>
        !!l && typeof l.key === "string" && typeof l.itemId === "string" && Number.isInteger(l.qty) && l.qty > 0 && typeof l.sel === "object",
    );
  } catch {
    return [];
  }
}

function write(slug: string, lines: StoredLine[]) {
  try {
    if (lines.length) localStorage.setItem(storageKey(slug), JSON.stringify({ lines }));
    else localStorage.removeItem(storageKey(slug));
  } catch {
    // Storage unavailable (private mode): the bag simply won't persist.
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

/**
 * The bag for one restaurant. `items` is the live menu (owner overrides
 * applied), by dish id; lines whose dish is gone, sold out or unpriced drop out.
 */
export function useBag(slug: string, items: Map<string, MenuItem>) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => "",
  );
  const stored = useMemo(() => parse(raw), [raw]);

  const lines = useMemo(() => {
    const out: ResolvedLine[] = [];
    for (const l of stored) {
      const item = items.get(l.itemId);
      if (!item || !orderable(item)) continue;
      const groups = optionGroups(item);
      const unit = unitPrice(item, groups, l.sel);
      const choices = chosen(groups, l.sel);
      if (unit === null || !choices) continue;
      out.push({ key: l.key, item, qty: l.qty, unit, selections: l.sel, choices });
    }
    return out;
  }, [stored, items]);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + l.unit * l.qty, 0);

  const qtyOf = useCallback((itemId: string) => lines.reduce((n, l) => (l.item.id === itemId ? n + l.qty : n), 0), [lines]);

  const add = useCallback(
    (itemId: string, selections: Selections = {}, qty = 1) => {
      const current = parse(read(slug));
      const key = lineKey(itemId, selections);
      const existing = current.find((l) => l.key === key);
      if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
      else current.push({ key, itemId, qty: Math.min(MAX_QTY, qty), sel: selections });
      write(slug, current);
    },
    [slug],
  );

  const setLineQty = useCallback(
    (key: string, qty: number) => {
      const next = parse(read(slug))
        .map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l))
        .filter((l) => l.qty > 0);
      write(slug, next);
    },
    [slug],
  );

  /** One less of a dish that has no options (its line key is the dish id). */
  const removeOne = useCallback(
    (itemId: string) => {
      const line = parse(read(slug)).find((l) => l.key === itemId);
      if (line) setLineQty(itemId, line.qty - 1);
    },
    [slug, setLineQty],
  );

  const clear = useCallback(() => write(slug, []), [slug]);

  return { lines, count, total, qtyOf, add, setLineQty, removeOne, clear };
}

// ——— WhatsApp ———

/**
 * The number orders go to, digits only: the restaurant's WhatsApp link, else
 * the first UAE mobile (971 5X XXX XXXX) among its phone and extra phone links.
 * Landlines and 800/600 lines have no WhatsApp, so they never count. Null when
 * there is none, which hides the WhatsApp button and the bag.
 */
export function whatsappNumber(r: Pick<Restaurant, "links" | "phone">): string | null {
  const link = r.links.find((l) => l.kind === "whatsapp");
  const fromLink = link?.url.match(/(?:wa\.me\/|[?&]phone=)\+?(\d{8,15})/)?.[1];
  if (fromLink) return fromLink;
  const phones = [r.phone, ...r.links.filter((l) => l.kind === "phone").map((l) => l.url.replace(/^tel:/, ""))];
  for (const p of phones) {
    const digits = normalizePhone(p).replace(/\D/g, "");
    if (/^9715\d{8}$/.test(digits)) return digits;
  }
  return null;
}

export function whatsappUrl(number: string, text?: string) {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/**
 * The drafted order, short and in the language the diner was browsing in (dish
 * names too, falling back to the printed English): a bulleted list in WhatsApp's
 * own markup (`- ` bullets, `*bold*` total), each line with quantity, choices and
 * price, then a total from the menu. No fees, no blank lines.
 */
export function orderMessage(r: Restaurant, lines: ResolvedLine[], i18n: I18n) {
  const m = i18n.t.bag.message;
  const out: string[] = [m.greeting(i18n.pick(r.name, r.nameAr))];
  for (const l of lines) {
    const choices = l.choices.length ? ` (${l.choices.map((c) => i18n.pick(c.label, c.labelAr)).join(", ")})` : "";
    out.push(`- ${l.qty} × ${i18n.pick(l.item.name, l.item.nameAr)}${choices} — ${i18n.price(l.unit * l.qty, r.currency)}`);
  }
  const total = lines.reduce((sum, l) => sum + l.unit * l.qty, 0);
  out.push(`*${m.total}: ${i18n.price(total, r.currency)}*`, m.foundYou);
  return out.join("\n");
}

/** Every restaurant that has dishes waiting in a bag in this browser, with the dishes, count and total. */
export function useOpenBags(restaurants: Restaurant[]) {
  const raw = useSyncExternalStore(
    subscribe,
    () => restaurants.map((r) => read(r.slug)).join("\n"),
    () => "",
  );
  return useMemo(() => {
    const raws = raw ? raw.split("\n") : [];
    const out: { restaurant: Restaurant; names: MenuItem[]; count: number; total: number }[] = [];
    restaurants.forEach((restaurant, i) => {
      const stored = parse(raws[i] ?? "");
      if (!stored.length) return;
      const items = new Map(restaurant.menus.flatMap((m) => m.sections.flatMap((s) => s.items.map((it) => [it.id, it] as const))));
      const names: MenuItem[] = [];
      let count = 0;
      let total = 0;
      for (const l of stored) {
        const item = items.get(l.itemId);
        if (!item || !orderable(item)) continue;
        const unit = unitPrice(item, optionGroups(item), l.sel);
        if (unit === null) continue;
        if (!names.includes(item)) names.push(item);
        count += l.qty;
        total += unit * l.qty;
      }
      if (count > 0) out.push({ restaurant, names, count, total });
    });
    return out;
  }, [raw, restaurants]);
}
