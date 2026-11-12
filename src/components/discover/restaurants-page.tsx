"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Map as MapIcon, SearchX, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AreaSelect } from "@/components/area-select";
import { DiscoverFilterBar } from "@/components/discover-filter-bar";
import { EmptyState } from "@/components/empty-state";
import { MenuFormButton } from "@/components/menu-submission-form";
import { RestaurantCard } from "@/components/restaurant-card";
import { SuggestRestaurant } from "@/components/suggest-restaurant";
import { useI18n } from "@/i18n/client";
import { listAreas } from "@/lib/discover";
import { isPinned } from "@/lib/map";
import { EXIT, HIDDEN, pressable, SHOWN, SPRING } from "@/lib/motion";
import { arrivingFrom } from "@/lib/page-transition";
import { useHydrated } from "@/lib/store";
import { useDiscoverFilters } from "@/lib/use-discover-filters";
import { useInfiniteList } from "@/lib/use-infinite-list";
import { useLeave } from "@/lib/use-leave";
import { useIsOpen } from "@/lib/use-open-state";
import type { Restaurant } from "@/lib/types";

const PAGE_SIZE = 6;

/** Every restaurant, filtered by search, mood, area, open now and price, revealed as you scroll. */
export function RestaurantsPage({ restaurants }: { restaurants: Restaurant[] }) {
  const { t, href } = useI18n();
  const l = t.site.list;
  const qs = useSearchParams().toString();
  const isOpen = useIsOpen();
  const f = useDiscoverFilters(restaurants, isOpen);
  const areas = useMemo(() => listAreas(restaurants), [restaurants]);
  const resetKey = [f.query, f.mood, f.area, f.openNow, f.priceLevel, f.sort].join("|");
  const { shown, hasMore, loading, watchEnd } = useInfiniteList(f.results, PAGE_SIZE, resetKey);

  // Map pill: leaving through it, the list and the pill scale down and fade out; arriving from the map, the list scales up and fades in.
  const reduced = useReducedMotion();
  const { leaving, go } = useLeave();
  const [fromMap] = useState(() => arrivingFrom("list"));
  const out = leaving && !reduced;
  const hydrated = useHydrated();
  const mapHref = `${href("/map")}${qs ? `?${qs}` : ""}`;

  return (
    <main className="w-full bg-cream pb-24">
      {/* Transformed content stays apart from the fixed Map pill below: a transform would make it the pill's containing block. */}
      <motion.div
        style={{ transformOrigin: "50% 30%" }}
        initial={fromMap && !reduced ? { opacity: 0, scale: 0.96 } : false}
        animate={out ? { opacity: 0, scale: 0.96 } : SHOWN}
        transition={out ? EXIT : { ...SPRING, duration: 0.45 }}
      >
        <section>
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div>
                <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-plum sm:text-3xl">{l.title}</h1>
                <p className="mt-0.5 text-sm text-muted" aria-live="polite">
                  {l.count(f.results.length)}
                </p>
              </div>
              <AreaSelect value={f.area} onChange={f.setArea} areas={areas} className="h-10 rounded-full bg-white px-4 shadow-card ring-1 ring-line/70" />
            </div>
            {f.query && (
              <button
                type="button"
                onClick={() => f.setQuery("")}
                className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-plum px-3 text-sm font-medium text-white"
              >
                “{f.query}”
                <X className="h-3.5 w-3.5" aria-label={l.clearSearch} />
              </button>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <DiscoverFilterBar
                openNow={f.openNow}
                onOpenNowChange={f.setOpenNow}
                priceLevel={f.priceLevel}
                onPriceLevelChange={f.setPriceLevel}
                sort={f.sort}
                onSortChange={f.setSort}
              />
            </div>
            {f.hasFilters && (
              <button
                type="button"
                onClick={f.clearAll}
                className="hidden shrink-0 text-sm font-medium text-muted underline underline-offset-4 transition-colors duration-150 hover:text-ink sm:block"
              >
                {l.clearAll}
              </button>
            )}
          </div>

          {f.results.length > 0 ? (
            <>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence initial={false}>
                  {shown.map((m, i) => (
                    <motion.li
                      key={m.restaurant.slug}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: Math.min(i % PAGE_SIZE, 5) * 0.03 }}
                    >
                      <RestaurantCard restaurant={m.restaurant} matchedDish={m.dish} />
                    </motion.li>
                  ))}
                </AnimatePresence>
                {loading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <li key={`sk-${i}`} className="flex h-[96px] animate-pulse items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-line/70">
                      <span className="h-[72px] w-[72px] rounded-xl bg-soft" />
                      <span className="flex-1 space-y-2">
                        <span className="block h-3 w-1/2 rounded bg-soft" />
                        <span className="block h-3 w-3/4 rounded bg-soft" />
                      </span>
                    </li>
                  ))}
              </ul>
              <div ref={watchEnd} className="h-px" aria-hidden />
              {!hasMore && f.results.length > PAGE_SIZE && <p className="mt-8 text-center text-sm text-muted">{l.end}</p>}
            </>
          ) : (
            <div className="mt-6">
              <EmptyState icon={SearchX} title={l.emptyTitle} body={l.emptyBody}>
                <button
                  type="button"
                  onClick={f.clearAll}
                  className="h-10 rounded-full bg-plum px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-plum-soft"
                >
                  {l.clearFilters}
                </button>
                <p className="mt-3 text-sm text-muted">
                  <SuggestRestaurant source="listing" initialName={f.query} className="inline-flex min-h-11 items-center" />
                </p>
                <p className="text-sm text-muted">
                  <MenuFormButton
                    source="listing"
                    restaurant={f.query}
                    className="inline-flex min-h-11 items-center font-medium underline decoration-dashed decoration-1 underline-offset-4 transition-colors duration-150 hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    {t.menuForm.isItYours}
                  </MenuFormButton>
                </p>
              </EmptyState>
            </div>
          )}
        </div>

      </motion.div>

      {/* Rendered into <body>: inside the page, the template's entrance transform would make it the pill's
          containing block, so the "fixed" pill would ride the page (from the bottom after a deep scroll). */}
      {hydrated &&
        restaurants.some(isPinned) &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-30 flex justify-center md:bottom-6">
            <motion.div
              className="pointer-events-auto"
              initial={reduced ? false : HIDDEN}
              animate={out ? HIDDEN : SHOWN}
              transition={out ? EXIT : { ...SPRING, delay: 0.12 }}
              {...pressable(reduced)}
            >
              <Link
                href={mapHref}
                onClick={(e) => go(mapHref, { event: e, arrive: "map" })}
                className="flex h-11 items-center gap-2 rounded-full bg-plum px-5 text-sm font-semibold text-white shadow-bag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
              >
                <MapIcon className="h-4 w-4" aria-hidden />
                {t.map.title}
              </Link>
            </motion.div>
          </div>,
          document.body,
        )}
    </main>
  );
}
