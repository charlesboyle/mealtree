"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, MapPin, SearchX } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { Highlight } from "@/components/menu/highlight";
import { useMinute } from "@/components/open-status";
import { Photo } from "@/components/photo";
import { accentStyle } from "@/lib/accent";
import { cn, itemPriceLabel } from "@/lib/format";
import { openStatus } from "@/lib/hours";
import { type DishHit, parseQuery, scoreRestaurant, searchDishes } from "@/lib/search";
import type { Restaurant } from "@/lib/types";
import { RestaurantCard } from "./restaurant-card";
import { SearchBox } from "./search-box";

const EXAMPLES = ["tacos under $6", "vegan ramen", "pho", "burrata", "late-night fried chicken", "dosa"];

type Quick = "open" | "under10" | "under15" | "vegan";
const QUICK: { id: Quick; label: string }[] = [
  { id: "open", label: "Open now" },
  { id: "under10", label: "Under $10" },
  { id: "under15", label: "Under $15" },
  { id: "vegan", label: "Vegan" },
];

export function DiscoverPage({ restaurants }: { restaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState<Quick[]>([]);
  const deferred = useDeferredValue(query);
  const minute = useMinute();

  const parsed = useMemo(() => {
    const q = parseQuery(deferred);
    const tokens = [...q.tokens, ...(quick.includes("vegan") ? ["vegan"] : [])];
    const caps = [q.maxPrice, quick.includes("under10") ? 10 : undefined, quick.includes("under15") ? 15 : undefined]
      .filter((n): n is number => n !== undefined);
    return { tokens, maxPrice: caps.length ? Math.min(...caps) : undefined };
  }, [deferred, quick]);

  const pool = useMemo(() => {
    if (!quick.includes("open") || !minute) return restaurants;
    const now = new Date(minute * 60000);
    return restaurants.filter((r) => openStatus(r.hours, r.timezone, now).open);
  }, [restaurants, quick, minute]);

  const searching = parsed.tokens.length > 0 || parsed.maxPrice !== undefined;
  const textTokens = parseQuery(deferred).tokens;

  const matchedRestaurants = useMemo(() => {
    if (!textTokens.length) return [];
    return pool
      .map((r) => ({ r, s: scoreRestaurant(r, textTokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r);
  }, [pool, textTokens]);

  const dishes = useMemo(() => searchDishes(pool, parsed), [pool, parsed]);

  const toggle = (id: Quick) =>
    setQuick((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      // Price caps are exclusive with each other.
      const next = id === "under10" ? cur.filter((x) => x !== "under15") : id === "under15" ? cur.filter((x) => x !== "under10") : cur;
      return [...next, id];
    });

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <Link
          href="/claim"
          className="pressable rounded-full px-3.5 py-2 text-[13.5px] font-medium text-ink-2 ring-1 ring-line hover:text-ink hover:ring-line-strong"
        >
          For restaurants
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-6 pt-8 sm:pt-14">
        <div className="mx-auto max-w-2xl sm:text-center">
          <p className="inline-flex animate-rise items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand">
            <MapPin className="size-3.5" strokeWidth={2.2} /> Mission District, San Francisco
          </p>
          <h1 className="mt-4 animate-rise font-display text-[44px] leading-[0.98] tracking-[-0.025em] text-ink [animation-delay:50ms] [font-variation-settings:'opsz'_72] sm:text-[64px]">
            Every menu nearby, <em className="text-brand">searchable</em>.
          </h1>
          <p className="mt-4 animate-rise text-[16px] leading-relaxed text-ink-2 [animation-delay:100ms] sm:text-[17px]">
            Real prices and photos for {restaurants.length} neighborhood spots. Search a craving, not a
            restaurant.
          </p>
        </div>

        <div className="sticky top-3 z-20 mx-auto mt-7 max-w-2xl animate-rise [animation-delay:150ms]">
          <SearchBox value={query} onChange={setQuery} examples={EXAMPLES} label="Search dishes or restaurants" />
        </div>
        <div className="no-scrollbar -mx-5 mt-3 flex animate-rise gap-1.5 overflow-x-auto px-5 [animation-delay:200ms] sm:justify-center">
          {QUICK.map((q) => {
            const on = quick.includes(q.id);
            return (
              <button
                key={q.id}
                onClick={() => toggle(q.id)}
                aria-pressed={on}
                className={cn(
                  "pressable h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium",
                  on ? "bg-ink text-bg" : "bg-surface text-ink-2 ring-1 ring-line hover:text-ink",
                )}
              >
                {q.id === "open" && (
                  <span className={cn("mr-1.5 inline-block size-1.5 rounded-full align-middle", on ? "bg-[#6ee7a8]" : "bg-positive")} />
                )}
                {q.label}
              </button>
            );
          })}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        <AnimatePresence mode="wait" initial={false}>
          {searching ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="mx-auto max-w-2xl"
            >
              {matchedRestaurants.length > 0 && (
                <div className="mb-8">
                  <SectionLabel>Restaurants</SectionLabel>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {matchedRestaurants.slice(0, 4).map((r, i) => (
                      <RestaurantCard key={r.slug} restaurant={r} index={i} />
                    ))}
                  </div>
                </div>
              )}
              <SectionLabel>
                {dishes.length ? `${dishes.length}${dishes.length === 40 ? "+" : ""} dishes` : "Dishes"}
                {parsed.maxPrice !== undefined && ` under $${parsed.maxPrice}`}
              </SectionLabel>
              {dishes.length ? (
                <ul className="divide-y divide-line">
                  {dishes.map((hit, i) => (
                    <DishResult key={hit.restaurant.slug + hit.item.id} hit={hit} tokens={parsed.tokens} index={i} />
                  ))}
                </ul>
              ) : (
                matchedRestaurants.length === 0 && <NoResults query={deferred} onClear={() => { setQuery(""); setQuick([]); }} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <SectionLabel>{quick.includes("open") ? "Open right now" : "In the neighborhood"}</SectionLabel>
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {pool.map((r, i) => (
                  <RestaurantCard key={r.slug} restaurant={r} index={i} />
                ))}
              </div>
              {pool.length === 0 && (
                <p className="py-16 text-center text-[15px] text-ink-3">Everything&apos;s closed right now. Check back soon.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="text-ink" />
          <p>Menus are collected from in-person visits, photos, and owners. Prices may change.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-3">{children}</h2>;
}

function DishResult({ hit, tokens, index }: { hit: DishHit; tokens: string[]; index: number }) {
  const { restaurant: r, item } = hit;
  return (
    <li data-accent className="animate-rise" style={{ ...accentStyle(r.accent), animationDelay: `${Math.min(index, 10) * 25}ms` }}>
      <Link
        href={`/r/${r.slug}#dish-${item.id}`}
        className="group -mx-3 flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors hover:bg-surface"
      >
        <Photo id={item.image} alt={item.name} width={72} className="size-14 shrink-0 rounded-2xl ring-1 ring-line" iconSize={18} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium tracking-[-0.01em] text-ink">
            <Highlight text={item.name} tokens={tokens} />
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-2">
            <span className="font-medium text-accent">{r.name}</span>
            <span className="mx-1.5 text-ink-3">·</span>
            {hit.section}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("tabular text-[15px] font-semibold", item.soldOut && "text-ink-3 line-through")}>
            {itemPriceLabel(item)}
          </span>
          <ArrowUpRight className="size-4 text-ink-3 transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </Link>
    </li>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-ink-3">
        <SearchX className="size-6" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-[15px] font-medium">
        {query ? <>No dishes match &ldquo;{query}&rdquo;</> : "No dishes match these filters"}
      </p>
      <p className="mt-1 text-[13.5px] text-ink-3">Try a broader word, like &ldquo;noodles&rdquo; or &ldquo;chicken&rdquo;.</p>
      <button onClick={onClear} className="pressable mt-5 rounded-full bg-surface-2 px-4 py-2 text-[13.5px] font-medium">
        Clear search
      </button>
    </div>
  );
}
