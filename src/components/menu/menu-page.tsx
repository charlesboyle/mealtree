"use client";

import { Search, X } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BagBar } from "@/components/bag-bar";
import { BagSheet } from "@/components/bag-sheet";
import { ContactSheet } from "@/components/contact-sheet";
import { DishSheet } from "@/components/dish-sheet";
import { OriginalMenuSheet } from "@/components/original-menu";
import { OwnerInterestForm } from "@/components/owner-interest-form";
import { useToast } from "@/components/providers";
import { Rail } from "@/components/rail";
import { RestaurantCard } from "@/components/restaurant-card";
import { useI18n } from "@/i18n/client";
import { accentStyle } from "@/lib/accent";
import { optionGroups, orderMessage, type Selections, useBag, whatsappNumber, whatsappUrl } from "@/lib/bag";
import { cn, itemMinPrice } from "@/lib/format";
import { OPEN_DISH_EVENT } from "@/lib/search-events";
import { autoLayout, type MenuLayout, photoCount, sectionLayout } from "@/lib/menu-layout";
import { parseQuery, scoreItem, sectionText } from "@/lib/search";
import { writePending } from "@/lib/order-feedback";
import { useOverrides } from "@/lib/store";
import type { OrderChannel, OwnerInterestSource } from "@/lib/surveys";
import { track } from "@/lib/track";
import { useMenuLayout } from "@/lib/use-menu-layout";
import type { MenuItem, MenuSection as MenuSectionData, Restaurant } from "@/lib/types";
import { type Filter, FilterChips } from "./filter-chips";
import { MenuIndexSheet } from "./menu-index-sheet";
import { MenuLayoutToggle } from "./menu-layout-toggle";
import { OwnerPrompt } from "./owner-prompt";
import { MenuNav, type MenuTab } from "./menu-nav";
import { MenuPopular } from "./menu-popular";
import { MenuSection } from "./menu-section";
import { MenuSideNav } from "./menu-side-nav";
import { MenuSourceNote } from "./menu-source-note";
import { MenuTopBar } from "./menu-top-bar";
import { OrderFeedbackCard } from "./order-feedback-card";
import { RestaurantHero } from "./restaurant-hero";
import { useMenuScroll } from "./use-menu-scroll";

type ViewSection = MenuSectionData & { key: string; label: string; groupLabel?: string };

export function MenuPage({ restaurant: r, more }: { restaurant: Restaurant; more: Restaurant[] }) {
  const i18n = useI18n();
  const { t, pick } = i18n;
  const toast = useToast();
  const style = useMemo(() => accentStyle(r.accent), [r.accent]);
  const overrides = useOverrides(r.slug);
  const claimed = r.claimed || overrides.claimed;
  const name = pick(r.name, r.nameAr);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"bag" | "contact" | "index" | "original" | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerSource, setOwnerSource] = useState<OwnerInterestSource>("restaurant_page");
  const closeOwner = useCallback(() => setOwnerOpen(false), []);
  const deferredQuery = useDeferredValue(query);
  const parsed = useMemo(() => parseQuery(deferredQuery), [deferredQuery]);
  const hasQuery = parsed.tokens.length > 0 || parsed.maxPrice !== undefined;
  const narrowed = hasQuery || filters.length > 0;
  // Photo cards drop the description, so a text search always shows rows where its matches are highlighted.
  const searching = parsed.tokens.length > 0;
  const [layoutOverride, chooseLayout] = useMenuLayout();

  // Every dish with the owner's live edits (sold out, price) applied.
  const itemsById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const m of r.menus)
      for (const s of m.sections)
        for (const item of s.items) {
          const soldOut = overrides.soldOut[item.id];
          const price = overrides.price[item.id];
          map.set(item.id, soldOut === undefined && price === undefined ? item : { ...item, soldOut: soldOut ?? item.soldOut, price: price ?? item.price });
        }
    return map;
  }, [r.menus, overrides]);

  // All menus (food, drinks…) read as one continuous list.
  const sections: ViewSection[] = useMemo(
    () =>
      r.menus.flatMap((m) =>
        m.sections
          .map((s, index) => {
            const text = sectionText(s);
            const items = s.items
              .map((i) => itemsById.get(i.id) ?? i)
              .map((item) => ({ item, score: scoreItem(item, text, parsed.tokens) }))
              .filter(({ item, score }) => {
                if (score <= 0) return false;
                const min = itemMinPrice(item);
                if (parsed.maxPrice !== undefined && (min === null || min > parsed.maxPrice)) return false;
                return filters.every((f) => item.tags?.includes(f));
              })
              .sort((a, b) => (hasQuery ? b.score - a.score : 0))
              .map(({ item }) => item);
            // A menu's own note (e.g. breakfast hours) rides on its first section.
            const menuNote = index === 0 && m.note ? { description: m.note, descriptionAr: m.noteAr } : {};
            return {
              ...s,
              ...(s.description ? {} : menuNote),
              items,
              key: `${m.id}:${s.id}`,
              label: pick(s.name, s.nameAr),
              groupLabel: s.group ? pick(s.group, s.groupAr) : undefined,
            };
          })
          .filter((s) => s.items.length > 0),
      ),
    [r.menus, itemsById, hasQuery, parsed, filters, pick],
  );

  const available = useMemo(() => {
    const set = new Set<Filter>();
    for (const i of itemsById.values()) {
      i.tags?.forEach((tag) => set.add(tag));
    }
    return set;
  }, [itemsById]);

  // Layouts come from each section's full dish list, never the filtered one, so a section doesn't flip while the diner filters.
  const layouts = useMemo(() => {
    const map = new Map<string, MenuLayout>();
    for (const m of r.menus) for (const s of m.sections) map.set(`${m.id}:${s.id}`, sectionLayout(s.items, layoutOverride, searching));
    return map;
  }, [r.menus, layoutOverride, searching]);
  const { anyAutoGrid, anyPhoto } = useMemo(() => {
    const all = r.menus.flatMap((m) => m.sections);
    return { anyAutoGrid: all.some((s) => autoLayout(s.items) === "grid"), anyPhoto: all.some((s) => photoCount(s.items) > 0) };
  }, [r.menus]);
  // The toggle only matters when it can change something, so a menu without photos never shows it.
  const showLayoutToggle = anyAutoGrid || (layoutOverride !== null && anyPhoto);
  const firstGrid = sections.find((s) => layouts.get(s.key) === "grid")?.key;
  const shownLayout: MenuLayout = layoutOverride ?? (firstGrid ? "grid" : "list");
  const pickLayout = (layout: MenuLayout) => {
    chooseLayout(layout);
    track(r.slug, i18n.locale, { kind: "menu_layout", layout });
  };

  const popular = useMemo(
    () => (narrowed ? [] : [...itemsById.values()].filter((i) => i.popular && !i.soldOut)),
    [narrowed, itemsById],
  );

  const tabs: MenuTab[] = useMemo(
    () => [
      ...(popular.length ? [{ id: "sec-popular", label: t.menu.popular }] : []),
      ...sections.map((s) => ({ id: `sec-${s.key}`, label: s.label, count: s.items.length })),
    ],
    [popular.length, sections, t],
  );
  const { active, jumpTo } = useMenuScroll(useMemo(() => tabs.map((x) => x.id), [tabs]));

  // ——— Ordering ———
  const number = whatsappNumber(r);
  const ordering = number !== null;
  const bag = useBag(r.slug, itemsById);
  const whatsappHref = number ? whatsappUrl(number, bag.count ? orderMessage(r, bag.lines, i18n) : undefined) : null;
  const trackWhatsapp = () => track(r.slug, i18n.locale, { kind: "link_click", link: "whatsapp" });
  // Remember that the diner left for WhatsApp or a call, so we can ask afterwards whether they ordered.
  const markOrder = (channel: OrderChannel) => {
    if (bag.count > 0) writePending({ slug: r.slug, channel, at: Date.now(), itemCount: bag.count });
  };

  // ——— Dish sheet and deep links ———
  const openItem = openId ? (itemsById.get(openId) ?? null) : null;

  useEffect(() => {
    const fromHash = () => {
      const id = location.hash.match(/^#dish-(.+)$/)?.[1];
      const found = id ? decodeURIComponent(id) : null;
      setOpenId(found && itemsById.has(found) ? found : null);
      if (found && itemsById.has(found)) track(r.slug, i18n.locale, { kind: "dish_open", itemId: found });
    };
    // A search result for a dish on this same page: the Link changes the hash without a hashchange.
    const onAnnounce = (e: Event) => {
      const { slug, itemId } = (e as CustomEvent<{ slug: string; itemId: string }>).detail;
      if (slug !== r.slug || !itemsById.has(itemId)) return;
      setOpenId(itemId);
      track(r.slug, i18n.locale, { kind: "dish_open", itemId });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener(OPEN_DISH_EVENT, onAnnounce);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener(OPEN_DISH_EVENT, onAnnounce);
    };
    // Only on mount; later opens are driven by taps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ?claim=1 (old claim links, outreach messages) opens the owner form once, then leaves the URL clean.
  useEffect(() => {
    const openFromQuery = () => {
      const params = new URLSearchParams(location.search);
      if (params.get("claim") !== "1") return;
      params.delete("claim");
      const rest = params.toString();
      history.replaceState(null, "", location.pathname + (rest ? `?${rest}` : "") + location.hash);
      if (claimed) return;
      setOwnerSource("claim_redirect");
      setOwnerOpen(true);
    };
    openFromQuery();
    // Only on mount.
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
  const quickAdd = useCallback(
    (item: MenuItem) => {
      if (optionGroups(item).length) openDish(item);
      else bag.add(item.id);
    },
    [bag, openDish],
  );
  const quickRemove = useCallback((item: MenuItem) => bag.removeOne(item.id), [bag]);
  const addConfigured = useCallback(
    (item: MenuItem, selections: Selections, qty: number) => bag.add(item.id, selections, qty),
    [bag],
  );

  // ——— Chrome ———
  const sentinel = useRef<HTMLDivElement>(null);
  const [heroPassed, setHeroPassed] = useState(false);
  // The contents switch on 48px before the hero clears the bar, so they are ready the moment it is uncovered. Checking the sentinel
  // on every scroll frame (not via IntersectionObserver, which lags on fast flings) keeps the compact
  // bar in lockstep with the strip, so there is never a frame where one is stuck without the other.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const check = () => setHeroPassed(el.getBoundingClientRect().top <= 96);
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  const titleRef = useRef<HTMLHeadingElement>(null);

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
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    if (window.scrollY > top) window.scrollTo({ top });
  }, [deferredQuery, filters]);

  // One anonymous view per session, for the owner's dashboard.
  useEffect(() => track(r.slug, i18n.locale, { kind: "view" }), [r.slug, i18n.locale]);

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

  const toggleFilter = (f: Filter) => setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const reset = () => {
    setQuery("");
    setFilters([]);
  };
  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);

  const rowProps = { tokens: parsed.tokens, currency: r.currency, ordering, onOpen: openDish, onAdd: quickAdd, onRemove: quickRemove };

  return (
    <>
    <div data-accent style={style} className="bg-cream">
      <MenuTopBar restaurant={r} visible={heroPassed} query={query} onQueryChange={setQuery} />

      <main className={ordering ? "pb-[calc(8rem+env(safe-area-inset-bottom))]" : "pb-10"}>
        <RestaurantHero
          restaurant={r}
          claimed={claimed}
          whatsappHref={whatsappHref}
          onShare={share}
          onOpenContact={() => setSheet("contact")}
          titleRef={titleRef}
        />
        <div ref={sentinel} className="h-px" aria-hidden />

        <MenuNav tabs={tabs} activeId={active} onSelect={jumpTo} onOpenIndex={() => setSheet("index")} />

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-4 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:pt-6">
          <aside
            className="no-scrollbar hidden lg:sticky lg:top-[88px] lg:block lg:max-h-[calc(100vh-104px)] lg:self-start lg:overflow-y-auto"
            aria-label={t.restaurant.page}
          >
            <MenuSideNav restaurant={r} tabs={tabs} activeId={active} onSelect={jumpTo} onOpenContact={() => setSheet("contact")} />
          </aside>

          <div className="min-w-0">
            <div
              ref={menuStart}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 sm:flex sm:gap-3"
            >
              {/* Phones: search and the layout toggle share a line, chips scroll on the next. */}
              <label className={cn("relative block w-full sm:max-w-xs", !showLayoutToggle && "col-span-2")}>
                <span className="sr-only">{t.menu.searchLabel}</span>
                <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                  placeholder={t.restaurant.searchDishes}
                  enterKeyHint="search"
                  className="h-11 w-full rounded-full bg-soft ps-10 pe-10 text-base text-ink placeholder:text-muted transition-[background-color,box-shadow] duration-150 focus:bg-white focus:shadow-pill focus:outline-none focus:ring-1 focus:ring-line [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={t.common.clearSearch}
                    className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </label>
              <FilterChips available={available} active={filters} onToggle={toggleFilter} className="order-3 col-span-2 sm:order-2 sm:min-w-0 sm:flex-1" />
              {showLayoutToggle && <MenuLayoutToggle layout={shownLayout} onChoose={pickLayout} className="sm:order-3 sm:ms-auto" />}
            </div>

            <MenuSourceNote restaurant={r} claimed={claimed} onViewOriginal={() => setSheet("original")} />

            {narrowed && (
              <p className="animate-fade pt-4 text-sm text-ink-3">
                <span className="tabular font-medium text-ink-2">{t.menu.results(resultCount)}</span>
                {parsed.maxPrice !== undefined && ` · ${t.price.under(i18n.price(parsed.maxPrice, r.currency))}`}
                {filters.length > 0 && (
                  <button type="button" onClick={() => setFilters([])} className="ms-3 min-h-11 font-medium text-accent">
                    {t.menu.clearFilters}
                  </button>
                )}
              </p>
            )}

            {popular.length > 0 && (
              <MenuPopular id="sec-popular" items={popular} qtyOf={bag.qtyOf} {...rowProps} />
            )}

            {sections.map((s) => (
              <MenuSection
                key={s.key}
                id={`sec-${s.key}`}
                title={s.label}
                description={s.description && !narrowed ? pick(s.description, s.descriptionAr) : undefined}
                note={s.key === firstGrid ? t.menu.photosIllustrative : undefined}
                layout={layouts.get(s.key) ?? "list"}
                items={s.items}
                qtyOf={bag.qtyOf}
                {...rowProps}
              />
            ))}

            {sections.length === 0 && (
              <div className="animate-fade mt-8 rounded-2xl bg-soft px-6 py-12 text-center">
                <p className="text-lg font-semibold text-ink">{deferredQuery ? t.menu.emptyQuery(deferredQuery) : t.menu.emptyFilters}</p>
                <p className="mt-2 text-sm text-muted">{t.menu.emptyHint}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 h-10 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:scale-[1.02] hover:bg-ink/90"
                >
                  {t.menu.showAll}
                </button>
              </div>
            )}
          </div>
        </div>

        {more.length > 0 && (
          <div className="mx-auto mt-16 max-w-6xl px-4 sm:px-6 lg:px-8">
            <Rail title={t.restaurant.moreTitle(name)} subtitle={t.restaurant.moreSub} size="compact">
              {more.map((m) => (
                <RestaurantCard key={m.slug} restaurant={m} compact />
              ))}
            </Rail>
          </div>
        )}

        <OwnerPrompt
          restaurant={r}
          claimed={claimed}
          onClaim={() => {
            setOwnerSource("restaurant_page");
            setOwnerOpen(true);
          }}
        />
      </main>

      {ordering && number && (
        <>
          <BagBar count={bag.count} total={bag.total} currency={r.currency} onOpen={() => setSheet("bag")} />
          <BagSheet
            open={sheet === "bag"}
            onClose={closeSheet}
            restaurantName={name}
            currency={r.currency}
            style={style}
            lines={bag.lines}
            count={bag.count}
            total={bag.total}
            whatsappHref={whatsappUrl(number, orderMessage(r, bag.lines, i18n))}
            phone={r.phone}
            onQty={bag.setLineQty}
            onSend={() => {
              trackWhatsapp();
              markOrder("whatsapp");
            }}
            onCall={() => markOrder("call")}
          />
          <OrderFeedbackCard slug={r.slug} blocked={sheet !== null || openItem !== null || ownerOpen} barVisible={bag.count > 0} />
        </>
      )}
      <DishSheet
        item={openItem}
        currency={r.currency}
        claimed={claimed}
        style={style}
        ordering={ordering}
        onAdd={addConfigured}
        onClose={closeDish}
      />
      <ContactSheet restaurant={r} open={sheet === "contact"} onClose={closeSheet} style={style} />
      <OwnerInterestForm open={ownerOpen} onClose={closeOwner} source={ownerSource} restaurant={{ slug: r.slug, name }} style={style} />
      <MenuIndexSheet
        open={sheet === "index"}
        onClose={closeSheet}
        entries={[
          ...(popular.length ? [{ id: "sec-popular", label: t.menu.popular }] : []),
          ...sections.map((s) => ({ id: `sec-${s.key}`, label: s.label, count: s.items.length, group: s.groupLabel })),
        ]}
        activeId={active}
        onSelect={jumpTo}
        style={style}
      />
      {r.menuFiles && <OriginalMenuSheet files={r.menuFiles} open={sheet === "original"} onClose={closeSheet} />}
    </div>
    </>
  );
}
