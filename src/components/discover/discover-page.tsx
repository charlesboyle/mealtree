"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/logo";
import { Highlight } from "@/components/menu/highlight";
import { PriceTag } from "@/components/menu/price-tag";
import { Chip } from "@/components/menu/filter-chips";
import { useMinute } from "@/components/open-status";
import { Photo } from "@/components/photo";
import { useI18n } from "@/i18n/client";
import { accentStyle } from "@/lib/accent";
import { cn } from "@/lib/format";
import { openStatus } from "@/lib/hours";
import { type DishHit, parseQuery, scoreRestaurant, searchDishes } from "@/lib/search";
import type { Restaurant } from "@/lib/types";
import { RestaurantCard } from "./restaurant-card";
import { SearchBox } from "./search-box";

type Quick = "open" | "under25" | "under50" | "vegetarian";
const CAPS: Partial<Record<Quick, number>> = { under25: 25, under50: 50 };

export function DiscoverPage({ restaurants }: { restaurants: Restaurant[] }) {
  const i18n = useI18n();
  const { t, href } = i18n;
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState<Quick[]>([]);
  const deferred = useDeferredValue(query);
  const minute = useMinute();

  const text = useMemo(() => parseQuery(deferred), [deferred]);
  const parsed = useMemo(() => {
    const tokens = [...text.tokens, ...(quick.includes("vegetarian") ? ["vegetarian"] : [])];
    const caps = [text.maxPrice, ...quick.map((q) => CAPS[q])].filter((n): n is number => n !== undefined);
    return { tokens, maxPrice: caps.length ? Math.min(...caps) : undefined };
  }, [text, quick]);

  const pool = useMemo(() => {
    if (!quick.includes("open") || !minute) return restaurants;
    const now = new Date(minute * 60000);
    return restaurants.filter((r) => openStatus(r.hours, r.timezone, now).open);
  }, [restaurants, quick, minute]);

  const searching = parsed.tokens.length > 0 || parsed.maxPrice !== undefined;

  const matchedRestaurants = useMemo(() => {
    if (!text.tokens.length) return [];
    return pool
      .map((r) => ({ r, s: scoreRestaurant(r, text.tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r);
  }, [pool, text.tokens]);

  const dishes = useMemo(() => searchDishes(pool, parsed), [pool, parsed]);

  const toggle = (id: Quick) =>
    setQuick((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      // Price caps are exclusive with each other.
      return [...(CAPS[id] ? cur.filter((x) => !CAPS[x]) : cur), id];
    });

  const quickLabels: Record<Quick, string> = {
    open: t.discover.quick.open,
    under25: t.discover.quick.under25(i18n.price(25)),
    under50: t.discover.quick.under50(i18n.price(50)),
    vegetarian: t.discover.quick.vegetarian,
  };

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4 sm:px-6">
        <Logo />
        <span className="ms-2 text-sm text-ink-3">{t.common.city}</span>
        <div className="ms-auto flex items-center gap-1">
          <LanguageToggle />
          <Link
            href={href("/claim")}
            className="pressable inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            {t.common.forRestaurants}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-4 pt-6 sm:px-6 sm:pt-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t.discover.title}</h1>
          <p className="mt-2 text-base text-ink-2 sm:text-md">{t.discover.lead(restaurants.length)}</p>
        </div>
      </section>

      <div className="sticky top-0 z-20 bg-bg/95 pb-3 pt-2 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <SearchBox value={query} onChange={setQuery} label={t.discover.searchLabel} />
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {(Object.keys(quickLabels) as Quick[]).map((q) => (
                <Chip key={q} on={quick.includes(q)} onClick={() => toggle(q)}>
                  {quickLabels[q]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        {!query && (
          <p className="max-w-2xl pb-2 pt-1 text-sm text-ink-3">
            {t.discover.try}:{" "}
            {t.discover.examples.map((ex, i) => (
              <span key={ex}>
                <button onClick={() => setQuery(ex)} className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
                  {ex}
                </button>
                {i < t.discover.examples.length - 1 && <span className="text-ink-3">{i18n.locale === "ar" ? "، " : ", "}</span>}
              </span>
            ))}
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {searching ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="max-w-2xl pt-4"
            >
              {matchedRestaurants.length > 0 && (
                <div className="mb-8">
                  <SectionLabel>{t.discover.restaurants}</SectionLabel>
                  <div className="divide-y divide-line sm:grid sm:grid-cols-2 sm:gap-6 sm:divide-y-0">
                    {matchedRestaurants.slice(0, 4).map((r) => (
                      <RestaurantCard key={r.slug} restaurant={r} />
                    ))}
                  </div>
                </div>
              )}
              <SectionLabel>
                {t.discover.dishes(dishes.length, dishes.length === 40)}
                {parsed.maxPrice !== undefined && (
                  <span className="font-normal text-ink-3"> · {t.price.under(i18n.price(parsed.maxPrice))}</span>
                )}
              </SectionLabel>
              {dishes.length ? (
                <ul className="divide-y divide-line">
                  {dishes.map((hit) => (
                    <DishResult key={hit.restaurant.slug + hit.item.id} hit={hit} tokens={parsed.tokens} />
                  ))}
                </ul>
              ) : (
                matchedRestaurants.length === 0 && (
                  <NoResults
                    query={deferred}
                    onClear={() => {
                      setQuery("");
                      setQuick([]);
                    }}
                  />
                )
              )}
            </motion.div>
          ) : (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="pt-4"
            >
              <SectionLabel>
                {quick.includes("open") ? t.discover.openNow : t.discover.all}
                <span className="font-normal text-ink-3"> · {t.discover.count(pool.length)}</span>
              </SectionLabel>
              <div className="divide-y divide-line sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:divide-y-0 lg:grid-cols-3">
                {pool.map((r, i) => (
                  <RestaurantCard key={r.slug} restaurant={r} priority={i < 3} />
                ))}
              </div>
              {pool.length === 0 && <p className="py-16 text-center text-base text-ink-3">{t.discover.allClosed}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t.discover.footer}</p>
          <nav className="flex gap-4">
            <Link href={href("/terms")} className="hover:text-ink">
              {t.common.terms}
            </Link>
            <Link href={href("/privacy")} className="hover:text-ink">
              {t.common.privacy}
            </Link>
            <Link href={href("/remove")} className="hover:text-ink">
              {t.common.removePage}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-base font-semibold text-ink sm:mb-4">{children}</h2>;
}

function DishResult({ hit, tokens }: { hit: DishHit; tokens: string[] }) {
  const { pick, href } = useI18n();
  const { restaurant: r, item, section } = hit;
  const name = pick(item.name, item.nameAr);
  return (
    <li data-accent style={accentStyle(r.accent)}>
      <Link
        href={href(`/r/${r.slug}#dish-${item.id}`)}
        className="-mx-2 flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-surface-2/60"
      >
        {item.image && <Photo id={item.image} alt="" width={64} className="size-12 shrink-0 rounded-lg" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-md font-medium text-ink">
            <Highlight text={name} tokens={tokens} />
          </p>
          <p className="truncate text-sm text-ink-3">
            <span className="font-medium text-ink-2">{pick(r.name, r.nameAr)}</span>
            <span className="mx-1.5">·</span>
            {pick(section.name, section.nameAr)}
          </p>
        </div>
        <PriceTag
          item={item}
          currency={r.currency}
          className={cn("shrink-0 text-base font-medium text-ink", item.soldOut && "text-ink-3 line-through")}
        />
      </Link>
    </li>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  const { t } = useI18n();
  return (
    <div className="py-14 text-center">
      <p className="text-md font-medium">{query ? t.discover.noMatchQuery(query) : t.discover.noMatchFilters}</p>
      <p className="mt-1 text-sm text-ink-3">{t.discover.noMatchHint}</p>
      <button
        onClick={onClear}
        className="pressable mt-5 h-10 rounded-lg border border-line-strong px-4 text-sm font-medium hover:bg-surface-2"
      >
        {t.common.clearSearch}
      </button>
    </div>
  );
}
