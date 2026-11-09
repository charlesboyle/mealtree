"use client";

import { ArrowLeft, LayoutList, LocateFixed, LocateOff, SearchX, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AreaSelect } from "@/components/area-select";
import { EmptyState } from "@/components/empty-state";
import { MapCards, type MapCardData, type Selection } from "@/components/map/map-cards";
import type { MapPadding, PinData, VisibleArea } from "@/components/map/map-canvas";
import { useLocation } from "@/components/map/use-location";
import { Sheet, useMediaQuery } from "@/components/sheet";
import { useI18n } from "@/i18n/client";
import { listAreas } from "@/lib/discover";
import { cn, itemPriceLabel } from "@/lib/format";
import { boundsOf, COVERAGE_KM, inBox, isOutsideCoverage, isPinned, nearestKm, orderByView, sortByDistance } from "@/lib/map";
import { cameFromSite } from "@/lib/nav-history";
import { EXIT, HIDDEN, popInOut, pressable, SHOWN, SPRING } from "@/lib/motion";
import { hasMounted } from "@/lib/page-transition";
import { useHydrated } from "@/lib/store";
import { useLeave } from "@/lib/use-leave";
import { useDiscoverFilters } from "@/lib/use-discover-filters";
import { useFullMenus } from "@/lib/use-full-menus";
import { useIsOpen } from "@/lib/use-open-state";
import type { Restaurant } from "@/lib/types";

// The map library and its CSS load only here, in the browser.
const MapCanvas = dynamic(() => import("@/components/map/map-canvas"), { ssr: false, loading: () => <div className="absolute inset-0 bg-soft" /> });

// Pixels of the map covered by the top bar and the card row (phones).
const PADDING_PHONE: MapPadding = { top: 84, bottom: 200, left: 32, right: 32 };
const PADDING_DESKTOP: MapPadding = { top: 84, bottom: 48, left: 48, right: 48 };

const chip =
  "flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold shadow-pill transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum";
const floating =
  "pointer-events-auto grid size-11 place-items-center rounded-full bg-white text-plum shadow-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum";
const aboveCards = "bottom-[calc(136px+env(safe-area-inset-bottom))] lg:bottom-6";
const sheetClass = "w-full max-w-md rounded-t-3xl bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-3xl";

/** Full-screen map of the restaurants the current search and filters match, with a card per pin. */
export function MapPage({ restaurants }: { restaurants: Restaurant[] }) {
  const i18n = useI18n();
  const { t, href, pick } = i18n;
  const router = useRouter();
  const params = useSearchParams();
  const isOpen = useIsOpen();
  const f = useDiscoverFilters(restaurants, isOpen);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const geo = useLocation();
  const areas = useMemo(() => listAreas(restaurants), [restaurants]);
  const allPinned = useMemo(() => restaurants.filter(isPinned), [restaurants]);

  // `r=<slug>` opens centred on that restaurant, selected. Only read once.
  const [opening] = useState(() => params.get("r"));
  const start = useMemo(() => allPinned.find((r) => r.slug === opening) ?? null, [allPinned, opening]);
  const [selection, setSelection] = useState<Selection>({ slug: opening, from: "init" });
  // Tapping the selected pin again lets go of it.
  const selectPin = useCallback((slug: string) => setSelection((s) => (s.slug === slug ? { slug: null, from: "clear" } : { slug, from: "pin" })), []);
  const deselect = useCallback(() => setSelection((s) => (s.slug === null ? s : { slug: null, from: "clear" })), []);
  const selectCard = useCallback((slug: string) => setSelection((s) => (s.slug === slug ? s : { slug, from: "card" })), []);

  // What the search matched, with dish prices and photos from the full menus (cards ship trimmed ones).
  const pinned = useMemo(() => f.results.flatMap(({ restaurant, dish }) => (isPinned(restaurant) ? [{ restaurant, dish }] : [])), [f.results]);
  const dishSlugs = useMemo(() => pinned.filter((m) => m.dish).map((m) => m.restaurant.slug), [pinned]);
  const withMenus = useFullMenus(restaurants, dishSlugs);
  const dishes = useMemo(() => {
    const bySlug = new Map(withMenus.map((r) => [r.slug, r]));
    const out = new Map<string, NonNullable<MapCardData["dish"]>>();
    for (const { restaurant, dish } of pinned) {
      if (!dish) continue;
      const item = bySlug.get(restaurant.slug)?.menus.flatMap((m) => m.sections.flatMap((s) => s.items)).find((i) => i.id === dish.id);
      out.set(restaurant.slug, { ...dish, image: item?.image, price: item ? itemPriceLabel(item, i18n, restaurant.currency) : undefined });
    }
    return out;
  }, [pinned, withMenus, i18n]);

  // Located inside what we cover: nearest first, with distances.
  const { position } = geo;
  const near = useMemo(() => (position && !isOutsideCoverage(position, allPinned) ? position : null), [position, allPinned]);
  const baseCards = useMemo<MapCardData[]>(() => {
    const base = pinned.map(({ restaurant }) => ({ restaurant, dish: dishes.get(restaurant.slug) }));
    if (!near) return base;
    return sortByDistance(
      base.map((b) => ({ ...b, lat: b.restaurant.lat, lng: b.restaurant.lng })),
      near,
    ).map(({ item, km }) => ({ restaurant: item.restaurant, dish: item.dish, km }));
  }, [pinned, dishes, near]);
  const rough = Boolean(position && position.accuracy > 1000);

  // Order of the results for this result set, as the visitor last left the map (see `onUserMove`).
  // Order does not matter for the camera, so moving nearest-first or in-view-first never refits.
  const fitKey = useMemo(() => baseCards.map((c) => c.restaurant.slug).sort().join(","), [baseCards]);
  const [view, setView] = useState<{ key: string; order: string[] } | null>(null);
  const cards = useMemo(() => {
    if (!view || view.key !== fitKey) return baseCards;
    const rank = new Map(view.order.map((slug, i) => [slug, i]));
    return [...baseCards].sort((a, b) => (rank.get(a.restaurant.slug) ?? 1e9) - (rank.get(b.restaurant.slug) ?? 1e9));
  }, [baseCards, view, fitKey]);

  const pins = useMemo<PinData[]>(
    () =>
      cards.map(({ restaurant, dish }) => ({
        restaurant,
        dish: dish?.price ? { image: dish.image, price: dish.price } : undefined,
      })),
    [cards],
  );
  const selectedSlug = cards.some((c) => c.restaurant.slug === selection.slug) ? selection.slug : null;
  const bounds = useMemo(() => boundsOf(cards.map((c) => c.restaurant)), [cards]);
  const fit = useMemo(() => ({ key: fitKey, bounds }), [fitKey, bounds]);

  // The visitor moved the map: the pins in view come first, nearest the middle of the free area; the rest keep their order.
  // The selected restaurant stays selected (and first) while it is in view, and is let go once it is not.
  const live = useRef({ cards, selected: selection.slug, fitKey });
  useEffect(() => {
    live.current = { cards, selected: selection.slug, fitKey };
  });
  const onUserMove = useCallback(({ box, centre }: VisibleArea) => {
    const { cards, selected, fitKey } = live.current;
    const places = cards.map((c) => c.restaurant);
    const keep = selected ? places.find((r) => r.slug === selected) : undefined;
    const keepInView = keep ? inBox(keep, box) : false;
    const order = orderByView(places, box, centre, keepInView ? (r) => r.slug === selected : undefined).map((r) => r.slug);
    setView((prev) => (prev && prev.key === fitKey && prev.order.join() === order.join() ? prev : { key: fitKey, order }));
    if (selected && !keepInView) setSelection({ slug: null, from: "clear" });
  }, []);

  // Location: asked for only on tap, never on load.
  const [sheet, setSheet] = useState<"ask" | "blocked" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; n: number } | null>(null);
  const roughShown = useRef(false);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Escape lets go of the selection (unless a sheet is open: it takes Escape first).
  useEffect(() => {
    if (sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") deselect();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, deselect]);

  const arriveAt = (p: { lat: number; lng: number; accuracy: number }) => {
    const km = nearestKm(p, allPinned);
    if (km === null || km > COVERAGE_KM) return setNotice(t.map.outside(i18n.number(Math.round(km ?? 0))));
    setView(null); // nearest-first is the order again, until the map is moved
    setFlyTo((prev) => ({ lat: p.lat, lng: p.lng, n: (prev?.n ?? 0) + 1 }));
    if (p.accuracy > 1000 && !roughShown.current) {
      roughShown.current = true;
      setNotice(t.map.rough);
    }
  };
  const locateNow = async () => {
    if (position) return arriveAt(position);
    const res = await geo.request();
    if ("position" in res) arriveAt(res.position);
    else if (res.error === "denied") setSheet("blocked");
    else setNotice(t.map.locateFailed);
  };
  const onLocate = () => {
    if (geo.permission === "denied") setSheet("blocked");
    else if (geo.permission === "granted") void locateNow();
    else setSheet("ask");
  };
  const blocked = geo.permission === "denied";

  // Leaving: back where you came from, else the list with the same filters. A short exit plays first.
  const reduced = useReducedMotion();
  const { leaving, go, leave } = useLeave();
  // Animate only a client navigation. This page sits in a Suspense boundary, so on a first load it hydrates
  // after the template has marked the app mounted; `hydrated` is false while hydrating, which keeps the
  // first render identical to the server's (fully visible).
  const hydrated = useHydrated();
  const [animateIn] = useState(() => hydrated && hasMounted());
  const arrive = animateIn && !reduced;
  const out = leaving && !reduced;
  const listHref = useMemo(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("r");
    return `${href("/restaurants")}${next.size ? `?${next}` : ""}`;
  }, [params, href]);
  const back = () => (cameFromSite() ? leave(() => router.back(), "list") : go(listHref, { arrive: "list" }));

  // Controls come in staggered after the map, and drop out first when leaving.
  const stage = (delay: number) => ({
    initial: arrive ? HIDDEN : (false as const),
    animate: out ? HIDDEN : SHOWN,
    transition: out ? EXIT : { ...SPRING, delay },
  });
  const chipMotion = reduced
    ? { layout: false as const }
    : { layout: "position" as const, ...popInOut(reduced), ...pressable(reduced) };
  const press = pressable(reduced);
  const swap = reduced ? { initial: false as const } : { initial: { scale: 0.6, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.6, opacity: 0 }, transition: { duration: 0.15 } };
  const locateIcon = blocked ? "off" : geo.busy ? "busy" : "idle";

  return (
    <main className="relative h-[calc(100dvh-57px)] w-full overflow-hidden bg-soft md:h-[calc(100dvh-65px)]">
      <div className="absolute inset-0 lg:start-[380px] [&_.maplibregl-ctrl-bottom-left]:mb-[calc(128px+env(safe-area-inset-bottom))] [&_.maplibregl-ctrl-bottom-right]:mb-[calc(128px+env(safe-area-inset-bottom))] lg:[&_.maplibregl-ctrl-bottom-left]:mb-0 lg:[&_.maplibregl-ctrl-bottom-right]:mb-0">
        {/* The map scales up and fades in on arrival, and scales down and fades out on the way out. */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ transformOrigin: "50% 70%" }}
          initial={arrive ? { scale: 0.94, borderRadius: 28, opacity: 0 } : false}
          animate={out ? { scale: 0.94, borderRadius: 28, opacity: 0 } : { scale: 1, borderRadius: 0, opacity: 1 }}
          transition={out ? EXIT : { ...SPRING, duration: 0.5 }}
        >
          <MapCanvas
            pins={pins}
            selected={selectedSlug}
            onSelect={selectPin}
            onDeselect={deselect}
            onUserMove={onUserMove}
            fit={fit}
            start={start}
            padding={desktop ? PADDING_DESKTOP : PADDING_PHONE}
            keepVisible={desktop}
            user={position}
            flyToUser={flyTo}
          />
        </motion.div>

        <motion.div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 overflow-x-auto p-3 no-scrollbar" {...stage(0.12)}>
          <motion.button type="button" onClick={back} aria-label={t.common.back} layout={reduced ? false : "position"} {...press} className={cn(floating, "shrink-0")}>
            <ArrowLeft className="h-[18px] w-[18px] rtl:-scale-x-100" aria-hidden />
          </motion.button>
          <AnimatePresence initial={false} mode="popLayout">
            {f.query && (
              <motion.button key="query" type="button" onClick={() => f.setQuery("")} {...chipMotion} className={cn(chip, "pointer-events-auto bg-plum text-white")}>
                “{f.query}”
                <X className="h-3.5 w-3.5" aria-label={t.site.list.clearSearch} />
              </motion.button>
            )}
            {f.openNow && (
              <motion.button
                key="open"
                type="button"
                onClick={() => f.setOpenNow(false)}
                aria-label={t.map.clearOpenNow}
                {...chipMotion}
                className={cn(chip, "pointer-events-auto bg-plum text-white")}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden />
                {t.site.list.openNow}
                <X className="h-3.5 w-3.5" aria-hidden />
              </motion.button>
            )}
          </AnimatePresence>
          <motion.div layout={reduced ? false : "position"} {...press} className="shrink-0">
            <AreaSelect value={f.area} onChange={f.setArea} areas={areas} className="pointer-events-auto h-10 rounded-full bg-white px-4 shadow-pill" />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {notice && (
            <motion.div
              key={notice}
              className="pointer-events-none absolute inset-x-4 top-[68px] z-20 flex justify-center"
              {...popInOut(reduced)}
            >
              <p role="status" className="rounded-full bg-plum px-4 py-2 text-center text-sm font-medium text-white shadow-float">
                {notice}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("pointer-events-none absolute inset-x-0 z-10 flex justify-center lg:hidden", aboveCards)}>
          <motion.div {...stage(0.3)} {...press} className="pointer-events-auto">
            <Link href={listHref} onClick={(e) => go(listHref, { event: e, arrive: "list" })} className={cn(chip, "bg-white text-plum")}>
              <LayoutList className="h-4 w-4" aria-hidden />
              {t.map.list}
            </Link>
          </motion.div>
        </div>
        <motion.button
          type="button"
          onClick={onLocate}
          aria-label={blocked ? t.map.locateBlocked : t.map.locate}
          aria-busy={geo.busy}
          {...stage(0.24)}
          {...press}
          className={cn(floating, "absolute end-4 z-10", aboveCards, blocked && "text-muted")}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={locateIcon}
              className="grid place-items-center"
              {...swap}
              {...(locateIcon === "busy" && !reduced ? { animate: { scale: 1, opacity: [1, 0.35, 1] }, transition: { scale: { duration: 0.15 }, opacity: { duration: 1.1, repeat: Infinity } } } : {})}
            >
              {blocked ? <LocateOff className="h-5 w-5" aria-hidden /> : <LocateFixed className="h-5 w-5" aria-hidden />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-4">
          <AnimatePresence>
            {cards.length === 0 && (
              <motion.div
                key="empty"
                className="pointer-events-auto w-full max-w-sm"
                {...popInOut(reduced)}
              >
                <EmptyState icon={SearchX} title={t.site.list.emptyTitle} body={t.site.list.emptyBody} compact>
                  <motion.button type="button" onClick={f.clearAll} {...press} className="h-10 rounded-full bg-plum px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-plum-soft">
                    {t.site.list.clearFilters}
                  </motion.button>
                </EmptyState>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {cards.length > 0 && <MapCards items={cards} selection={selection} onSelect={selectCard} desktop={desktop} rough={rough} leaving={out} animateIn={arrive} />}

      <Sheet open={sheet === "ask"} onClose={() => setSheet(null)} label={t.map.locateTitle} look="modal" dragToClose className={sheetClass}>
        <div className="mx-auto h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="flex flex-col items-center pt-5 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-soft text-plum">
            <LocateFixed className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-3 text-lg font-bold text-plum">{t.map.locateTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.map.locateNote}</p>
          <motion.button
            type="button"
            onClick={() => {
              setSheet(null);
              void locateNow();
            }}
            {...pressable(reduced, 0.97)}
            className="mt-5 h-11 w-full rounded-full bg-plum text-sm font-semibold text-white transition-colors duration-150 hover:bg-plum-soft"
          >
            {t.map.continue}
          </motion.button>
        </div>
      </Sheet>

      <Sheet open={sheet === "blocked"} onClose={() => setSheet(null)} label={t.map.blockedTitle} look="modal" dragToClose className={sheetClass}>
        <div className="mx-auto h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="flex flex-col items-center pt-5 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-soft text-muted">
            <LocateOff className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-3 text-lg font-bold text-plum">{t.map.blockedTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.map.blockedBody}</p>
          <p className="mt-5 text-xs font-semibold text-muted">{t.map.pickArea}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {areas.map((a) => (
              <motion.button
                key={a.name}
                type="button"
                {...press}
                onClick={() => {
                  f.setArea(a.name);
                  setSheet(null);
                }}
                className="h-9 rounded-full bg-plum/[0.05] px-4 text-sm font-medium text-plum active:bg-plum/[0.1]"
              >
                {pick(a.name, a.nameAr)}
              </motion.button>
            ))}
          </div>
        </div>
      </Sheet>
    </main>
  );
}
