"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Search, Share, X } from "lucide-react";
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
import { LanguageToggle } from "@/components/language-toggle";
import { LogoMark } from "@/components/logo";
import { useToast } from "@/components/providers";
import { useI18n } from "@/i18n/client";
import { accentStyle } from "@/lib/accent";
import { cn, itemMinPrice } from "@/lib/format";
import { parseQuery, scoreItem, sectionText } from "@/lib/search";
import { useOverrides } from "@/lib/store";
import { track } from "@/lib/track";
import type { MenuItem, MenuSection, Restaurant } from "@/lib/types";
import { type Filter, FilterChips } from "./filter-chips";
import { InfoSection } from "./info-card";
import { ItemRow } from "./item-row";
import { ItemSheet } from "./item-sheet";
import { RestaurantHeader } from "./restaurant-header";

const TOPBAR = 56;
const TABBAR = 52;
/** Extra height of the group row, shown above the section tabs on long menus. */
const GROUPBAR = 44;

type ViewSection = MenuSection & { key: string; label: string };

export function MenuPage({ restaurant: r }: { restaurant: Restaurant }) {
  const i18n = useI18n();
  const { t, pick } = i18n;
  const style = useMemo(() => accentStyle(r.accent), [r.accent]);
  const overrides = useOverrides(r.slug);
  const claimed = r.claimed || overrides.claimed;
  const name = pick(r.name, r.nameAr);

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

  // All menus (food, drinks…) read as one continuous list with one row of section tabs.
  const sections: ViewSection[] = useMemo(() => {
    return r.menus.flatMap((m) =>
      m.sections
        .map((s, index) => {
          const text = sectionText(s);
          const items = s.items
            .map(applyOverrides)
            .map((item) => ({ item, score: scoreItem(item, text, parsed.tokens) }))
            .filter(({ item, score }) => {
              if (score <= 0) return false;
              const min = itemMinPrice(item);
              if (parsed.maxPrice !== undefined && (min === null || min > parsed.maxPrice)) return false;
              return filters.every((f) => (f === "popular" ? item.popular : item.tags?.includes(f)));
            })
            .sort((a, b) => (hasQuery ? b.score - a.score : 0))
            .map(({ item }) => item);
          const label = pick(s.name, s.nameAr);
          // A menu's own note (e.g. breakfast hours) rides on its first section.
          const menuNote = index === 0 && m.note ? { description: m.note, descriptionAr: m.noteAr } : {};
          return { ...s, ...(s.description ? {} : menuNote), items, key: `${m.id}:${s.id}`, label };
        })
        .filter((s) => s.items.length > 0),
    );
  }, [r.menus, hasQuery, parsed, filters, applyOverrides, pick]);

  const available = useMemo(() => {
    const set = new Set<Filter>();
    for (const m of r.menus)
      for (const s of m.sections)
        for (const i of s.items) {
          if (i.popular) set.add("popular");
          i.tags?.forEach((tag) => set.add(tag));
        }
    return set;
  }, [r.menus]);

  // Long menus can group sections ('Grills', 'Drinks'): a row of groups above the section tabs.
  const groups = useMemo(() => {
    if (hasQuery || searching) return [];
    const seen = new Map<string, { key: string; label: string; first: string }>();
    for (const s of sections)
      if (s.group && !seen.has(s.group)) seen.set(s.group, { key: s.group, label: pick(s.group, s.groupAr), first: s.key });
    return seen.size > 1 ? [...seen.values()] : [];
  }, [sections, hasQuery, searching, pick]);
  const tabbar = TABBAR + (groups.length ? GROUPBAR : 0);

  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);
  const narrowed = hasQuery || filters.length > 0;

  // ——— Top bar fills in once the restaurant name scrolls under it ———
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
        if (el && el.getBoundingClientRect().top - (TOPBAR + tabbar) - 32 <= 0) current = s.key;
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
  }, [sections, tabbar]);

  const jumpTo = (key: string) => {
    const el = document.getElementById(`sec-${key}`);
    if (!el) return;
    lock.current = key;
    setActive(key);
    const top = el.getBoundingClientRect().top + window.scrollY - (TOPBAR + tabbar) + 1;
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
  }, [deferredQuery, filters]);

  // One anonymous view per session, for the owner's dashboard.
  useEffect(() => track(r.slug, i18n.locale, { kind: "view" }), [r.slug, i18n.locale]);

  // ——— Deep links: /r/slug#dish-<id> ———
  const allItems = useMemo(() => r.menus.flatMap((m) => m.sections.flatMap((s) => s.items)), [r.menus]);
  useEffect(() => {
    const fromHash = () => {
      const id = location.hash.match(/^#dish-(.+)$/)?.[1];
      const item = id && allItems.find((i) => i.id === decodeURIComponent(id));
      setOpenItem(item ? applyOverrides(item) : null);
      if (item) track(r.slug, i18n.locale, { kind: "dish_open", itemId: item.id });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // Only on mount; later opens are driven by clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDish = useCallback(
    (item: MenuItem) => {
      setOpenItem(item);
      history.replaceState(null, "", `#dish-${item.id}`);
      track(r.slug, i18n.locale, { kind: "dish_open", itemId: item.id });
    },
    [r.slug, i18n.locale],
  );
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
      <TopBar restaurant={r} name={name} compact={compact} />

      <RestaurantHeader restaurant={r} claimed={claimed} titleRef={titleRef} />

      {/* ——— Sticky menu navigation ——— */}
      <div ref={menuStart} className="h-4" />
      <div
        className={cn(
          "sticky top-14 z-30 border-b bg-bg transition-[border-color,box-shadow] duration-300",
          compact ? "border-line" : "border-transparent",
        )}
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-5">
          {groups.length > 0 && (
            <GroupTabs
              groups={groups}
              active={sections.find((s) => s.key === active)?.group}
              onSelect={(g) => jumpTo(g.first)}
              label={t.menu.sections}
            />
          )}
          <AnimatePresence mode="popLayout" initial={false}>
            {searching ? (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="flex h-13 items-center gap-2"
              >
                <label className="flex h-10 flex-1 items-center gap-2 rounded-lg bg-surface-2 px-3 focus-within:ring-2 focus-within:ring-accent">
                  <Search className="size-4 shrink-0 text-ink-3" strokeWidth={2.2} />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                    placeholder={t.menu.searchPlaceholder(name)}
                    enterKeyHint="search"
                    className="h-full min-w-0 flex-1 bg-transparent text-md text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
                    type="search"
                    aria-label={t.menu.searchLabel}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      aria-label={t.common.clearSearch}
                      className="grid size-5 place-items-center rounded-full bg-ink-3 text-surface"
                    >
                      <X className="size-3" strokeWidth={3} />
                    </button>
                  )}
                </label>
                <button onClick={closeSearch} className="pressable h-10 px-2 text-base font-medium text-ink">
                  {t.common.cancel}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="tabs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="flex h-13 items-stretch"
              >
                <button
                  onClick={() => setSearching(true)}
                  aria-label={t.menu.searchLabel}
                  className="pressable relative -ms-2 grid w-10 shrink-0 place-items-center text-ink"
                >
                  <Search className="size-5" strokeWidth={2} />
                  {filters.length > 0 && (
                    <span className="absolute end-2 top-3 size-2 rounded-full bg-accent ring-2 ring-bg" />
                  )}
                </button>
                <SectionTabs
                  sections={groups.length ? sections.filter((s) => s.group === sections.find((x) => x.key === active)?.group) : sections}
                  active={active} onSelect={jumpTo} label={t.menu.sections} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 sm:px-5">
        <div className="space-y-3 pt-4">
          <FilterChips available={available} active={filters} onToggle={toggleFilter} />
        </div>

        {narrowed && (
          <p className="animate-fade pt-3 text-sm text-ink-3">
            <span className="tabular font-medium text-ink-2">{t.menu.results(resultCount)}</span>
            {parsed.maxPrice !== undefined && ` · ${t.price.under(i18n.price(parsed.maxPrice, r.currency))}`}
            {filters.length > 0 && (
              <button onClick={() => setFilters([])} className="ms-3 font-medium text-accent">
                {t.menu.clearFilters}
              </button>
            )}
          </p>
        )}

        {sections.length === 0 ? (
          <EmptyState
            query={deferredQuery}
            onReset={() => {
              setQuery("");
              setFilters([]);
            }}
          />
        ) : (
          sections.map((s) => (
            <section key={s.key} id={`sec-${s.key}`} aria-labelledby={`h-${s.key}`} className="pt-8">
              <h2 id={`h-${s.key}`} className="text-xl font-semibold tracking-tight text-ink">
                {s.label}
              </h2>
              {s.description && !narrowed && (
                <p className="mt-0.5 text-sm text-ink-3">{pick(s.description, s.descriptionAr)}</p>
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
                      <ItemRow item={item} tokens={parsed.tokens} onOpen={openDish} currency={r.currency} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))
        )}

        <InfoSection restaurant={r} />
        <Footer restaurant={r} claimed={claimed} />
      </main>

      <ItemSheet item={openItem} onClose={closeDish} claimed={claimed} accentStyle={style} currency={r.currency} />
    </div>
  );
}

function TopBar({ restaurant: r, name, compact }: { restaurant: Restaurant; name: string; compact: boolean }) {
  const { t, href } = useI18n();
  const toast = useToast();
  const share = async () => {
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: t.menu.shareTitle(name), url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t.menu.copied);
      }
    } catch {}
  };
  // Over the cover photo (phones only; from sm up the cover sits below the bar)
  // the controls sit on dark discs; on the page they're plain.
  const solid = compact || !r.cover;
  const glass = "max-sm:bg-black/40 max-sm:text-white max-sm:hover:bg-black/55";
  const control = cn("text-ink hover:bg-surface-2", !solid && glass);
  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-200",
        solid ? "bg-bg" : "bg-bg max-sm:bg-transparent",
        compact && "border-b border-line",
      )}
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-2 sm:px-3">
        <Link
          href={href("/")}
          transitionTypes={["nav-back"]}
          aria-label={t.menu.allRestaurants}
          className={cn("pressable grid size-10 place-items-center rounded-full", control)}
        >
          <ArrowLeft className="size-5 rtl:-scale-x-100" strokeWidth={2} />
        </Link>
        <div className="min-w-0 flex-1 overflow-hidden px-1">
          <p
            aria-hidden={!compact}
            className={cn(
              "truncate text-center text-base font-semibold transition-[opacity,transform] duration-200",
              compact ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            {name}
          </p>
        </div>
        <LanguageToggle className={cn("rounded-full", !solid && `${glass} max-sm:hover:text-white`)} />
        <button
          onClick={share}
          aria-label={t.menu.share}
          className={cn("pressable grid size-10 place-items-center rounded-full", control)}
        >
          <Share className="size-[18px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function GroupTabs({
  groups,
  active,
  onSelect,
  label,
}: {
  groups: { key: string; label: string; first: string }[];
  active?: string;
  onSelect: (group: { key: string; label: string; first: string }) => void;
  label: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const chips = useRef(new Map<string, HTMLButtonElement>());

  // Keep the active group in view (rect-based, so it works in RTL too).
  useEffect(() => {
    const el = active && chips.current.get(active);
    const container = strip.current;
    if (!el || !container) return;
    const a = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    container.scrollBy({ left: a.left + a.width / 2 - (c.left + c.width / 2), behavior: "smooth" });
  }, [active]);

  return (
    <div
      ref={strip}
      role="tablist"
      aria-label={label}
      className="no-scrollbar -mx-4 flex h-11 items-center gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5"
    >
      {groups.map((g) => {
        const on = active === g.key;
        return (
          <button
            key={g.key}
            ref={(el) => {
              if (el) chips.current.set(g.key, el);
              else chips.current.delete(g.key);
            }}
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(g)}
            className={cn(
              "pressable h-8 shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors duration-200",
              on ? "bg-accent text-on-accent" : "bg-surface-2 text-ink-2 hover:bg-surface-3",
            )}
          >
            {g.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionTabs({
  sections,
  active,
  onSelect,
  label,
}: {
  sections: ViewSection[];
  active?: string;
  onSelect: (key: string) => void;
  label: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const tabs = useRef(new Map<string, HTMLButtonElement>());

  // Center the active tab. Measured from rects, so it works the same in RTL
  // (where scrollLeft runs negative).
  useEffect(() => {
    const el = active && tabs.current.get(active);
    const container = strip.current;
    if (!el || !container) return;
    const a = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    container.scrollBy({ left: a.left + a.width / 2 - (c.left + c.width / 2), behavior: "smooth" });
  }, [active]);

  return (
    <div
      ref={strip}
      role="tablist"
      aria-label={label}
      className="no-scrollbar relative -me-4 flex flex-1 overflow-x-auto pe-4 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] sm:-me-5 sm:pe-5 rtl:[mask-image:linear-gradient(to_left,black_calc(100%-24px),transparent)]"
    >
      {sections.map((s) => {
        const on = active === s.key;
        return (
          <button
            key={s.key}
            ref={(el) => {
              if (el) tabs.current.set(s.key, el);
              else tabs.current.delete(s.key);
            }}
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(s.key)}
            className={cn(
              "relative shrink-0 px-3 text-sm font-medium transition-colors duration-200",
              on ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            <span className="whitespace-nowrap">{s.label}</span>
            {on && (
              <motion.span
                layoutId="section-tab"
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="animate-fade py-16 text-center">
      <p className="text-md font-medium text-ink">{query ? t.menu.emptyQuery(query) : t.menu.emptyFilters}</p>
      <p className="mt-1 text-sm text-ink-3">{t.menu.emptyHint}</p>
      <button
        onClick={onReset}
        className="pressable mt-5 h-10 rounded-lg border border-line-strong px-4 text-sm font-medium text-ink hover:bg-surface-2"
      >
        {t.menu.showAll}
      </button>
    </div>
  );
}

function Footer({ restaurant: r, claimed }: { restaurant: Restaurant; claimed: boolean }) {
  const { t, href } = useI18n();
  return (
    <footer className="mt-10 border-t border-line pt-6 text-center text-xs text-ink-3">
      <p>{t.menu.footerNote}</p>
      {!claimed && (
        <p className="mt-1">
          {t.menu.footerClaim}{" "}
          <Link href={href(`/claim/${r.slug}`)} transitionTypes={["nav-forward"]} className="font-medium text-accent hover:underline">
            {t.menu.footerClaimLink}
          </Link>{" "}
          {t.menu.footerOr}{" "}
          <Link href={href(`/remove?r=${r.slug}`)} className="underline-offset-2 hover:underline">
            {t.menu.footerRemove}
          </Link>
          .
        </p>
      )}
      <Link
        href={href("/")}
        className="pressable mt-6 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-ink-2 hover:bg-surface-2"
      >
        <LogoMark className="size-4" /> {t.menu.madeWith}{" "}
        <span lang="en" className="font-semibold text-ink">
          nomm
        </span>
      </Link>
      <nav className="mt-2 flex justify-center gap-4">
        <Link href={href("/terms")} className="hover:text-ink">
          {t.common.terms}
        </Link>
        <Link href={href("/privacy")} className="hover:text-ink">
          {t.common.privacy}
        </Link>
      </nav>
    </footer>
  );
}
