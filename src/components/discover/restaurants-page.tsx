"use client";

import { AnimatePresence, motion } from "motion/react";
import { SearchX, X } from "lucide-react";
import { useMemo } from "react";
import { AreaSelect } from "@/components/area-select";
import { DiscoverFilterBar } from "@/components/discover-filter-bar";
import { EmptyState } from "@/components/empty-state";
import { RestaurantCard } from "@/components/restaurant-card";
import { SuggestRestaurant } from "@/components/suggest-restaurant";
import { useI18n } from "@/i18n/client";
import { listAreas } from "@/lib/discover";
import { useDiscoverFilters } from "@/lib/use-discover-filters";
import { useInfiniteList } from "@/lib/use-infinite-list";
import { useIsOpen } from "@/lib/use-open-state";
import type { Restaurant } from "@/lib/types";

const PAGE_SIZE = 6;

/** Every restaurant, filtered by search, mood, area, open now and price, revealed as you scroll. */
export function RestaurantsPage({ restaurants }: { restaurants: Restaurant[] }) {
  const { t } = useI18n();
  const l = t.site.list;
  const isOpen = useIsOpen();
  const f = useDiscoverFilters(restaurants, isOpen);
  const areas = useMemo(() => listAreas(restaurants), [restaurants]);
  const resetKey = [f.query, f.mood, f.area, f.openNow, f.priceLevel, f.sort].join("|");
  const { shown, hasMore, loading, watchEnd } = useInfiniteList(f.results, PAGE_SIZE, resetKey);

  return (
    <main className="w-full bg-cream pb-24">
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
            </EmptyState>
          </div>
        )}
      </div>
    </main>
  );
}
