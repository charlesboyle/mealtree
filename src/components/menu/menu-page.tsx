"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Search, SearchX, Share, X } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LogoMark } from "@/components/logo";
import { useToast } from "@/components/providers";
import { accentStyle } from "@/lib/accent";
import { cn, itemMinPrice } from "@/lib/format";
import { parseQuery, scoreItem } from "@/lib/search";
import { useOverrides } from "@/lib/store";
import type { MenuItem, MenuSection, Restaurant } from "@/lib/types";
import { type Filter, FilterChips } from "./filter-chips";
import { InfoCard } from "./info-card";
import { ItemRow } from "./item-row";
import { ItemSheet } from "./item-sheet";
import { RestaurantHeader } from "./restaurant-header";

const TOPBAR = 56;
const TABBAR = 52;

type ViewSection = MenuSection & { key: string; label: string };

export function MenuPage({ restaurant: r }: { restaurant: Restaurant }) {
  const style = useMemo(() => accentStyle(r.accent), [r.accent]);
  const [overrides] = useOverrides(r.slug);
  const claimed = r.claimed || !!overrides.claimed;

  const [menuId, setMenuId] = useState(r.menus[0].id);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const deferredQuery = useDeferredValue(query);
  const parsed = useMemo(() => parseQuery(deferredQuery), [deferredQuery]);
  const hasQuery = parsed.tokens.length > 0 || parsed.maxPrice !== undefined;

  const applyOverrides = useCallback(
    (item: MenuItem): MenuItem => {
      const soldOut = overrides.soldOut[item.id];
      const price = overrides.price[item.id];
      if (soldOut === undefined && price === undefined) return item;
      return { ...item, soldOut: soldOut ?? item.soldOut, price: price ?? item.price };
    },
    [overrides],
  );

  // A search looks through every menu (food + drinks); filters stay on the current one.
  const sections: ViewSection[] = useMemo(() => {
    const menus = hasQuery ? r.menus : r.menus.filter((m) => m.id === menuId);
    const multi = hasQuery && r.menus.length > 1;
    return menus.flatMap((m) =>
      m.sections
        .map((s) => {
          const items = s.items
            .map(applyOverrides)
            .map((item) => ({ item, score: scoreItem(item, s.name, parsed.tokens) }))
            .filter(({ item, score }) => {
              if (score <= 0) return false;
              const min = itemMinPrice(item);
              if (parsed.maxPrice !== undefined && (min === null || min > parsed.maxPrice)) return false;
              return filters.every((f) => (f === "popular" ? item.popular : item.tags?.includes(f)));
            })
            .sort((a, b) => (hasQuery ? b.score - a.score : 0))
            .map(({ item }) => item);
          return { ...s, items, key: `${m.id}:${s.id}`, label: multi ? `${m.name} · ${s.name}` : s.name };
        })
        .filter((s) => s.items.length > 0),
    );
  }, [r.menus, menuId, hasQuery, parsed, filters, applyOverrides]);

  const available = useMemo(() => {
    const set = new Set<Filter>();
    for (const m of r.menus)
      for (const s of m.sections)
        for (const i of s.items) {
          if (i.popular) set.add("popular");
          i.tags?.forEach((t) => set.add(t));
        }
    return set;
  }, [r.menus]);

  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);
  const narrowed = hasQuery || filters.length > 0;

  // ——— Top bar reveal once the restaurant name scrolls under it ———
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCompact(e.boundingClientRect.bottom < TOPBAR), {
      rootMargin: `-${TOPBAR}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ——— Scroll spy ———
  const [active, setActive] = useState<string | undefined>(sections[0]?.key);
  const lock = useRef<string | null>(null);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      if (lock.current) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current: string | undefined = sections[0]?.key;
      for (const s of sections) {
        const el = document.getElementById(`sec-${s.key}`);
        if (el && el.getBoundingClientRect().top - (TOPBAR + TABBAR) - 32 <= 0) current = s.key;
      }
      if (atBottom && window.scrollY > 0) current = sections.at(-1)?.key;
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  const jumpTo = (key: string) => {
    const el = document.getElementById(`sec-${key}`);
    if (!el) return;
    lock.current = key;
    setActive(key);
    const top = el.getBoundingClientRect().top + window.scrollY - (TOPBAR + TABBAR) + 1;
    window.scrollTo({ top, behavior: "smooth" });
    const release = () => {
      lock.current = null;
      window.removeEventListener("scrollend", release);
    };
    window.addEventListener("scrollend", release);
    setTimeout(release, 1000);
  };

  // Keep results in view as they shrink: snap back to the top of the menu.
  const menuStart = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = menuStart.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - TOPBAR;
    if (window.scrollY > top) window.scrollTo({ top });
  }, [deferredQuery, filters, menuId]);

  // ——— Deep links: /r/slug#dish-<id> ———
  const allItems = useMemo(
    () => r.menus.flatMap((m) => m.sections.flatMap((s) => s.items)),
    [r.menus],
  );
  useEffect(() => {
    const fromHash = () => {
      const id = location.hash.match(/^#dish-(.+)$/)?.[1];
      const item = id && allItems.find((i) => i.id === decodeURIComponent(id));
      setOpenItem(item ? applyOverrides(item) : null);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // Only on mount; later opens are driven by clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDish = useCallback((item: MenuItem) => {
    setOpenItem(item);
    history.replaceState(null, "", `#dish-${item.id}`);
  }, []);
  const closeDish = useCallback(() => {
    setOpenItem(null);
    history.replaceState(null, "", location.pathname + location.search);
  }, []);

  const toggleFilter = (f: Filter) =>
    setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const closeSearch = () => {
    setSearching(false);
    setQuery("");
  };

  return (
    <div data-accent style={style} className="min-h-dvh bg-bg pb-10">
      <TopBar restaurant={r} compact={compact} />

      <RestaurantHeader restaurant={r} claimed={claimed} titleRef={titleRef} />

      {/* ——— Sticky menu navigation ——— */}
      <div ref={menuStart} className="h-6" />
      <div
        className={cn(
          "sticky top-14 z-30 border-b transition-[background-color,border-color,box-shadow] duration-300",
          compact
            ? "border-line bg-bg/95 shadow-[0_8px_20px_-16px_rgb(0_0_0/0.25)] backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-bg",
        )}
      >
        <div className="mx-auto max-w-2xl px-5">
          <AnimatePresence mode="popLayout" initial={false}>
            {searching ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                className="flex h-[52px] items-center gap-2"
              >
                <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-surface px-3.5 ring-1 ring-line-strong focus-within:ring-2 focus-within:ring-accent">
                  <Search className="size-4 shrink-0 text-ink-3" strokeWidth={2.2} />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                    placeholder={`Search ${r.name}`}
                    enterKeyHint="search"
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
                    type="search"
                    aria-label="Search this menu"
                  />
                  <AnimatePresence>
                    {query && (
                      <motion.button
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="grid size-5 place-items-center rounded-full bg-ink-3 text-surface"
                      >
                        <X className="size-3" strokeWidth={3} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </label>
                <button
                  onClick={closeSearch}
                  className="pressable h-10 px-2 text-[14.5px] font-medium text-accent"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="tabs"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
                className="flex h-[52px] items-center gap-1"
              >
                <button
                  onClick={() => setSearching(true)}
                  aria-label="Search this menu"
                  className="pressable relative -ml-1 grid size-10 shrink-0 place-items-center rounded-full text-ink hover:bg-surface-2"
                >
                  <Search className="size-[19px]" strokeWidth={2.2} />
                  {filters.length > 0 && (
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent ring-2 ring-bg" />
                  )}
                </button>
                <SectionTabs sections={sections} active={active} onSelect={jumpTo} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-5">
        <div className="space-y-3 pb-1 pt-4">
          {r.menus.length > 1 && !hasQuery && (
            <MenuSwitcher menus={r.menus} value={menuId} onChange={setMenuId} />
          )}
          <FilterChips available={available} active={filters} onToggle={toggleFilter} />
          {r.menus.find((m) => m.id === menuId)?.note && !hasQuery && (
            <p className="text-[13px] leading-relaxed text-ink-3">{r.menus.find((m) => m.id === menuId)?.note}</p>
          )}
        </div>

        <AnimatePresence initial={false}>
          {narrowed && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden text-[13px] text-ink-3"
            >
              <span className="block pt-2">
                <span className="tabular font-medium text-ink-2">{resultCount}</span>{" "}
                {resultCount === 1 ? "dish" : "dishes"}
                {parsed.maxPrice !== undefined && ` under $${parsed.maxPrice}`}
                {filters.length > 0 && (
                  <button onClick={() => setFilters([])} className="ml-2 font-medium text-accent">
                    Clear filters
                  </button>
                )}
              </span>
            </motion.p>
          )}
        </AnimatePresence>

        {sections.length === 0 ? (
          <EmptyState query={deferredQuery} onReset={() => { setQuery(""); setFilters([]); }} />
        ) : (
          sections.map((s, si) => (
            <section
              key={s.key}
              id={`sec-${s.key}`}
              aria-labelledby={`h-${s.key}`}
              className="animate-rise pt-7"
              style={{ animationDelay: `${Math.min(si, 4) * 50 + 200}ms` }}
            >
              <h2
                id={`h-${s.key}`}
                className="font-display text-[26px] leading-tight tracking-[-0.01em] text-ink [font-variation-settings:'opsz'_36]"
              >
                {s.label}
              </h2>
              {s.description && !narrowed && (
                <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{s.description}</p>
              )}
              <ul className="mt-1 divide-y divide-line">
                <AnimatePresence initial={false}>
                  {s.items.map((item) => (
                    <motion.li
                      key={item.id}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                      <ItemRow item={item} tokens={parsed.tokens} onOpen={openDish} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))
        )}

        <InfoCard restaurant={r} />
        <Footer restaurant={r} claimed={claimed} />
      </main>

      <ItemSheet item={openItem} onClose={closeDish} claimed={claimed} accentStyle={style} />
    </div>
  );
}

function TopBar({ restaurant: r, compact }: { restaurant: Restaurant; compact: boolean }) {
  const toast = useToast();
  const share = async () => {
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: `${r.name} menu`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Menu link copied");
      }
    } catch {}
  };
  const glass = compact
    ? "text-ink hover:bg-surface-2"
    : "bg-black/30 text-white backdrop-blur-md hover:bg-black/45";
  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow] duration-300",
        compact ? "bg-bg/95 backdrop-blur-xl backdrop-saturate-150" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-3 sm:px-5">
        <Link href="/" aria-label="All restaurants" className={cn("pressable grid size-10 place-items-center rounded-full", glass)}>
          <ArrowLeft className="size-5" strokeWidth={2.2} />
        </Link>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence>
            {compact && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="truncate text-center text-[15px] font-semibold tracking-tight"
              >
                {r.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button onClick={share} aria-label="Share menu" className={cn("pressable grid size-10 place-items-center rounded-full", glass)}>
          <Share className="size-[18px]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function SectionTabs({
  sections,
  active,
  onSelect,
}: {
  sections: ViewSection[];
  active?: string;
  onSelect: (key: string) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const tabs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const el = active && tabs.current.get(active);
    const container = strip.current;
    if (!el || !container) return;
    const left = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
    container.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <div
      ref={strip}
      className="no-scrollbar relative -mr-5 flex flex-1 gap-0.5 overflow-x-auto pr-5 [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]"
      role="tablist"
    >
      {sections.map((s) => (
        <button
          key={s.key}
          ref={(el) => {
            if (el) tabs.current.set(s.key, el);
            else tabs.current.delete(s.key);
          }}
          role="tab"
          aria-selected={active === s.key}
          onClick={() => onSelect(s.key)}
          className={cn(
            "relative shrink-0 rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors duration-200",
            active === s.key ? "text-on-accent" : "text-ink-2 hover:text-ink",
          )}
        >
          {active === s.key && (
            <motion.span
              layoutId="section-tab"
              className="absolute inset-0 rounded-full bg-accent"
              transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
            />
          )}
          <span className="relative whitespace-nowrap">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function MenuSwitcher({
  menus,
  value,
  onChange,
}: {
  menus: Restaurant["menus"];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Menu" className="inline-flex rounded-full bg-surface-2 p-1">
      {menus.map((m) => (
        <button
          key={m.id}
          role="radio"
          aria-checked={value === m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            "relative rounded-full px-4 py-1.5 text-[13.5px] font-semibold transition-colors",
            value === m.id ? "text-ink" : "text-ink-3 hover:text-ink-2",
          )}
        >
          {value === m.id && (
            <motion.span layoutId="menu-switch" className="absolute inset-0 rounded-full bg-surface shadow-sm" />
          )}
          <span className="relative">{m.name}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-16 text-center"
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-ink-3">
        <SearchX className="size-6" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-[15px] font-medium text-ink">
        {query ? <>Nothing matches &ldquo;{query}&rdquo;</> : "No dishes match these filters"}
      </p>
      <p className="mt-1 text-[13.5px] text-ink-3">Try a different word, or clear filters.</p>
      <button onClick={onReset} className="pressable mt-5 rounded-full bg-surface-2 px-4 py-2 text-[13.5px] font-medium">
        Show full menu
      </button>
    </motion.div>
  );
}

function Footer({ restaurant: r, claimed }: { restaurant: Restaurant; claimed: boolean }) {
  return (
    <footer className="mt-10 border-t border-line pt-6 text-center text-[12.5px] leading-relaxed text-ink-3">
      <p>Prices and availability may change. Please confirm with the restaurant.</p>
      {!claimed && (
        <p className="mt-1">
          Is this your restaurant?{" "}
          <Link href={`/claim/${r.slug}`} className="font-medium text-accent underline-offset-2 hover:underline">
            Claim this page for free
          </Link>
        </p>
      )}
      <Link href="/" className="pressable mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-2 hover:bg-surface-2">
        <LogoMark className="size-4" /> Menus by <span className="font-semibold text-ink">mealtree</span>
      </Link>
    </footer>
  );
}
