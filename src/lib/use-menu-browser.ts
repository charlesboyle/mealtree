"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { itemMinPrice } from "@/lib/format";
import { parseQuery, scoreItem, sectionText } from "@/lib/search";
import { useOverrides } from "@/lib/store";
import { track } from "@/lib/track";
import { useScrollSpy } from "@/lib/use-scroll-spy";
import type { DietTag, MenuItem, Restaurant } from "@/lib/types";

export type Diet = "veg" | "vegan" | "spicy" | "gf";

/** Which of the menu's printed tags satisfy each filter (vegan dishes are vegetarian too). */
const DIET_TAGS: Record<Diet, DietTag[]> = {
  veg: ["vegetarian", "vegan"],
  vegan: ["vegan"],
  spicy: ["spicy"],
  gf: ["gluten-free"],
};

export type MenuCategory = {
  /** Unique across menus; also the DOM id suffix. */
  id: string;
  name: string;
  group?: string;
  description?: string;
  items: MenuItem[];
};

// Sticky chrome height above the menu at each breakpoint, plus breathing room.
// Phone: compact top bar (48) + tabs (45). Tablet: site header (64) + tabs (53). Desktop: header only (sidebar index).
function chromeOffset(width: number): number {
  if (width >= 1024) return 88;
  if (width >= 768) return 124;
  return 100;
}

/** Menu state for one restaurant page: live dish data, search and filters, scroll spy, and the open dish. */
export function useMenuBrowser(r: Restaurant) {
  const i18n = useI18n();
  const { pick } = i18n;
  const overrides = useOverrides(r.slug);
  const [query, setQuery] = useState("");
  const [activeDiets, setActiveDiets] = useState<Diet[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [offset, setOffset] = useState(100);
  const timer = useRef<number | undefined>(undefined);
  const deferred = useDeferredValue(query);
  const parsed = useMemo(() => parseQuery(deferred), [deferred]);
  const hasQuery = parsed.tokens.length > 0 || parsed.maxPrice !== undefined;

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    const onResize = () => setOffset(chromeOffset(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Every dish with the owner's live edits (sold out, price) applied.
  const itemsById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const m of r.menus)
      for (const s of m.sections)
        for (const item of s.items) {
          const soldOut = overrides.soldOut[item.id];
          const price = overrides.price[item.id];
          map.set(
            item.id,
            soldOut === undefined && price === undefined ? item : { ...item, soldOut: soldOut ?? item.soldOut, price: price ?? item.price },
          );
        }
    return map;
  }, [r.menus, overrides]);

  const isFiltering = hasQuery || activeDiets.length > 0;

  // All menus (food, drinks…) read as one continuous list.
  const filteredMenu: MenuCategory[] = useMemo(
    () =>
      r.menus
        .flatMap((m) =>
          m.sections.map((s, index) => {
            const text = sectionText(s);
            const items = s.items
              .map((i) => itemsById.get(i.id) ?? i)
              .map((item) => ({ item, score: scoreItem(item, text, parsed.tokens) }))
              .filter(({ item, score }) => {
                if (score <= 0) return false;
                const min = itemMinPrice(item);
                if (parsed.maxPrice !== undefined && (min === null || min > parsed.maxPrice)) return false;
                return activeDiets.every((d) => DIET_TAGS[d].some((tag) => item.tags?.includes(tag)));
              })
              .sort((a, b) => (hasQuery ? b.score - a.score : 0))
              .map(({ item }) => item);
            // A menu's own note (e.g. breakfast hours) rides on its first section.
            const note = index === 0 && m.note ? pick(m.note, m.noteAr) : undefined;
            const description = s.description ? pick(s.description, s.descriptionAr) : note;
            return {
              id: `${m.id}:${s.id}`,
              name: pick(s.name, s.nameAr),
              group: s.group ? pick(s.group, s.groupAr) : undefined,
              description,
              items,
            };
          }),
        )
        .filter((c) => c.items.length > 0),
    [r.menus, itemsById, hasQuery, parsed, activeDiets, pick],
  );

  const popular = useMemo(
    () => (isFiltering ? [] : [...itemsById.values()].filter((i) => i.popular && !i.soldOut)),
    [isFiltering, itemsById],
  );

  const entries = useMemo(() => filteredMenu.flatMap((c) => c.items), [filteredMenu]);

  const tabs = useMemo(
    () => [
      ...(popular.length ? [{ id: "menu-popular", label: i18n.t.restaurant.featured }] : []),
      ...filteredMenu.map((c) => ({ id: `menu-${c.id}`, label: c.name, count: c.items.length })),
    ],
    [popular.length, filteredMenu, i18n.t],
  );

  const spyActive = useScrollSpy(
    tabs.map((t) => t.id),
    offset + 8,
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setPendingId(id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPendingId(null), 700);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  // ——— Open dish, with #dish-<id> deep links ———
  const openItem = openId ? (itemsById.get(openId) ?? null) : null;

  useEffect(() => {
    const fromHash = () => {
      const raw = location.hash.match(/^#dish-(.+)$/)?.[1];
      const id = raw ? decodeURIComponent(raw) : null;
      const known = !!id && itemsById.has(id);
      setOpenId(known ? id : null);
      if (known) track(r.slug, i18n.locale, { kind: "dish_open", itemId: id });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // Only on mount; later opens are driven by taps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDish = useCallback(
    (item: MenuItem) => {
      setOpenId(item.id);
      history.replaceState(null, "", `#dish-${item.id}`);
      track(r.slug, i18n.locale, { kind: "dish_open", itemId: item.id });
    },
    [r.slug, i18n.locale],
  );
  const closeDish = useCallback(() => {
    setOpenId(null);
    history.replaceState(null, "", location.pathname + location.search);
  }, []);
  const step = useCallback(
    (dir: 1 | -1) => {
      if (!entries.length) return;
      const at = entries.findIndex((i) => i.id === openId);
      const next = at < 0 ? (dir === 1 ? 0 : entries.length - 1) : (at + dir + entries.length) % entries.length;
      openDish(entries[next]);
    },
    [entries, openId, openDish],
  );

  const toggleDiet = (diet: Diet) => setActiveDiets((prev) => (prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]));

  // The diets some dish actually has, so a chip never leads to an empty menu.
  const availableDiets = useMemo(() => {
    const out = new Set<Diet>();
    for (const i of itemsById.values())
      for (const d of Object.keys(DIET_TAGS) as Diet[]) if (DIET_TAGS[d].some((tag) => i.tags?.includes(tag))) out.add(d);
    return out;
  }, [itemsById]);

  return {
    query,
    setQuery,
    tokens: parsed.tokens,
    maxPrice: parsed.maxPrice,
    activeDiets,
    toggleDiet,
    availableDiets,
    clearFilters: () => {
      setQuery("");
      setActiveDiets([]);
    },
    isFiltering,
    itemsById,
    filteredMenu,
    popular,
    tabs,
    activeTab: pendingId ?? spyActive,
    scrollToSection,
    openItem,
    openDish,
    closeDish,
    step,
    canStep: entries.length > 1,
  };
}
