"use client";

import { Star } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/photo";
import { RestaurantImage } from "@/components/restaurant-image";
import { useI18n } from "@/i18n/client";
import { cn, THUMB_WIDTH } from "@/lib/format";
import type { Pinned } from "@/lib/map";
import { EXIT, HIDDEN, pressable, SHOWN, SPRING } from "@/lib/motion";
import { useOpenState } from "@/lib/use-open-state";

export type MapCardData = {
  restaurant: Pinned;
  /** The dish a search matched, with its price and photo once known. */
  dish?: { id: string; name: string; nameAr?: string; image?: string; price?: string };
  /** Distance from the visitor in km, once located. */
  km?: number;
};

export type Selection = { slug: string | null; from: "init" | "pin" | "card" | "clear" };

const LOCK_MS = 900;

/**
 * Restaurants as a swipeable row of cards over the bottom of the map (phones) or a list in a side panel
 * (lg+). Scroll-snapping to a card selects it; selecting a pin scrolls its card into view.
 */
export function MapCards({
  items,
  selection,
  onSelect,
  desktop,
  rough,
  leaving,
  animateIn,
}: {
  items: MapCardData[];
  selection: Selection;
  onSelect: (slug: string) => void;
  desktop: boolean;
  rough: boolean;
  /** The page is on its way out: the row slides down (phones) or away (panel). */
  leaving: boolean;
  /** The page just arrived by navigation: cards come in staggered, after the map has settled. */
  animateIn: boolean;
}) {
  const { t, dir } = useI18n();
  const reduced = useReducedMotion();
  // Cards that appear later (new results) fade in too, but straight away; the first ones wait for the map.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 700);
    return () => clearTimeout(timer);
  }, []);
  const enter = !reduced && (animateIn || settled);
  const out = !reduced && leaving;
  const list = useRef<HTMLUListElement>(null);
  const cards = useRef(new Map<string, HTMLLIElement>());
  // Scrolling we start ourselves must not read back as the visitor picking a card.
  const lockedUntil = useRef(0);
  const order = items.map((i) => i.restaurant.slug).join(",");
  // The row is swapped as a whole (old one scales down and fades out, new cards scale up and fade in) when
  // what you see first changes: after a pan, a filter or locating. A reorder of cards out of sight is silent.
  const swapKey = items
    .slice(0, 3)
    .map((i) => i.restaurant.slug)
    .join(",");

  // New order (filters, distance): back to the first card.
  useEffect(() => {
    lockedUntil.current = performance.now() + LOCK_MS;
    list.current?.scrollTo({ left: 0, top: 0, behavior: "instant" });
  }, [order]);

  // A pin was picked: bring its card into view.
  useEffect(() => {
    if (selection.from === "card") return;
    lockedUntil.current = performance.now() + LOCK_MS;
    // Cleared (pin tapped again, empty map, Esc): the lock alone stops a scroll still settling from re-picking a card.
    if (!selection.slug) return;
    cards.current.get(selection.slug)?.scrollIntoView({ behavior: selection.from === "init" ? "instant" : "smooth", inline: desktop ? "nearest" : "start", block: "nearest" });
  }, [selection, desktop]);

  // The row settled on a card: select it (the map then focuses that card's pin). Handled on the row element
  // itself, not with listeners added in an effect: after a swap the new row mounts only once the old one has
  // faded out, and an effect would still be holding the old one.
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(settleTimer.current), []);
  const onRowScroll = (e: React.UIEvent<HTMLUListElement>) => {
    if (desktop) return;
    const el = e.currentTarget;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (performance.now() < lockedUntil.current || !el.isConnected) return;
      const box = el.getBoundingClientRect();
      const rtl = dir === "rtl";
      let best: { slug: string; gap: number } | null = null;
      for (const [slug, card] of cards.current) {
        if (!el.contains(card)) continue;
        const r = card.getBoundingClientRect();
        const gap = Math.abs(rtl ? r.right - (box.right - 16) : r.left - (box.left + 16));
        if (!best || gap < best.gap) best = { slug, gap };
      }
      if (best) onSelect(best.slug);
    }, 90);
  };
  // The visitor's own swipe or wheel ends any lock left by our programmatic scrolling.
  const unlock = () => {
    lockedUntil.current = 0;
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.ul
        key={swapKey}
        ref={list}
        onScroll={onRowScroll}
        onTouchStart={unlock}
        onWheel={unlock}
        style={{ transformOrigin: desktop ? "50% 0%" : "50% 100%" }}
        animate={out ? { opacity: 0, scale: 0.94 } : SHOWN}
        exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.97, transition: { ...EXIT, duration: 0.12 } }}
        transition={out ? EXIT : { duration: 0 }}
        aria-label={t.map.resultsLabel}
        className={cn(
          "no-scrollbar absolute z-10 flex gap-3 overflow-x-auto",
          // Phones: snapping row over the map's bottom edge, the next card peeking in.
          "inset-x-0 bottom-0 snap-x snap-mandatory scroll-ps-4 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-1",
          // lg+: a panel on the start side.
          "lg:inset-y-0 lg:start-0 lg:w-[380px] lg:snap-none lg:scroll-ps-0 lg:flex-col lg:gap-2 lg:overflow-x-hidden lg:overflow-y-auto lg:border-e lg:border-line lg:bg-cream lg:p-3",
        )}
      >
        {items.map((item, i) => (
          <motion.li
            key={item.restaurant.slug}
            initial={enter ? HIDDEN : false}
            animate={SHOWN}
            transition={{ ...SPRING, delay: (animateIn && !settled ? 0.22 : 0) + Math.min(i, 4) * 0.035 }}
            {...pressable(reduced, 0.98)}
            // Called with null when the card goes (motion's own ref wrapper does not pass a cleanup function on).
            ref={(el) => {
              if (el) cards.current.set(item.restaurant.slug, el);
              else cards.current.delete(item.restaurant.slug);
            }}
            // The panel has no snapping, so pointing at (or tabbing to) a card is how it picks its pin.
            onMouseEnter={desktop ? () => onSelect(item.restaurant.slug) : undefined}
            onFocus={desktop ? () => onSelect(item.restaurant.slug) : undefined}
            className="w-[84%] max-w-[340px] shrink-0 snap-start lg:w-full lg:max-w-none lg:shrink"
          >
            <MapCard item={item} selected={selection.slug === item.restaurant.slug} rough={rough} />
          </motion.li>
        ))}
      </motion.ul>
    </AnimatePresence>
  );
}

function MapCard({ item: { restaurant: r, dish, km }, selected, rough }: { item: MapCardData; selected: boolean; rough: boolean }) {
  const { pick, href, distance } = useI18n();
  const status = useOpenState(r);
  const area = pick(r.neighborhood, r.neighborhoodAr);
  const meta = [area, km !== undefined ? distance(km, rough) : ""].filter(Boolean).join(" · ");
  return (
    <article
      className={cn(
        "relative flex h-full items-center gap-3 rounded-2xl bg-surface p-2.5 shadow-card ring-1 transition-shadow duration-200 ease-out",
        selected ? "ring-2 ring-plum" : "ring-line/70",
      )}
    >
      <div className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-soft">
        {dish?.image ? <Photo id={dish.image} alt="" width={THUMB_WIDTH} className="absolute inset-0 size-full" /> : <RestaurantImage restaurant={r} width={160} />}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={href(dish ? `/r/${r.slug}#dish-${dish.id}` : `/r/${r.slug}`)}
          className="block truncate text-[15px] font-semibold text-ink after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ink"
        >
          {pick(r.name, r.nameAr)}
        </Link>
        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink">
          {r.rating !== undefined && (
            <>
              <Star className="h-3 w-3 shrink-0 fill-tomato text-tomato" aria-hidden />
              <span className="font-medium">{r.rating.toFixed(1)}</span>
            </>
          )}
          <span className="truncate text-muted">
            {r.rating !== undefined && "· "}
            {meta}
          </span>
        </p>
        {dish && (
          <p className="mt-0.5 truncate text-sm text-muted">
            <span className="font-medium text-ink">{pick(dish.name, dish.nameAr)}</span>
            {dish.price && ` · ${dish.price}`}
          </p>
        )}
        {status && (
          <p className={cn("mt-1 flex items-center gap-1.5 truncate text-xs font-medium", status.open ? "text-fresh" : "text-muted")}>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.open ? "bg-fresh" : "bg-muted")} aria-hidden />
            {status.text}
          </p>
        )}
      </div>
    </article>
  );
}
