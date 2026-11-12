"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";
import Link from "next/link";
import { RestaurantImage } from "@/components/restaurant-image";
import { SaveButton } from "@/components/save-button";
import { useI18n } from "@/i18n/client";
import { knownFor } from "@/lib/discover";
import { useOpenState } from "@/lib/use-open-state";
import type { Restaurant } from "@/lib/types";

export type MatchedDish = { name: string; nameAr?: string };

/** Horizontal restaurant card: photo, rating, meta, what it is known for, live open state, heart. */
export function RestaurantCard({ restaurant: r, matchedDish, compact = false }: { restaurant: Restaurant; matchedDish?: MatchedDish; compact?: boolean }) {
  const { t, pick, href, cuisines, priceLevel } = useI18n();
  const status = useOpenState(r);
  const name = pick(r.name, r.nameAr);
  const area = pick(r.neighborhood, r.neighborhoodAr);
  const known = knownFor(r).map((i) => pick(i.name, i.nameAr));
  const meta = [cuisines(r.cuisine.slice(0, 1)), area, priceLevel(r.priceLevel)].filter(Boolean).join(" · ");
  return (
    <div className="group/lift h-full">
    <motion.article
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className={`group relative flex h-full items-center rounded-2xl bg-surface p-2.5 shadow-card ring-1 ring-line/70 transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lift:-translate-y-0.5 group-hover/lift:shadow-float ${compact ? "gap-2" : "gap-3"}`}
    >
      <div className={`relative shrink-0 overflow-hidden rounded-xl bg-soft ${compact ? "h-14 w-14" : "h-[72px] w-[72px]"}`}>
        <RestaurantImage restaurant={r} width={160} className="transition-transform duration-300 ease-out group-hover:scale-[1.06]" />
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <Link
          href={href(`/r/${r.slug}`)}
          className="block truncate text-[15px] font-semibold text-ink after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ink"
        >
          {name}
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
            {compact ? area : meta}
          </span>
        </p>
        {!compact && (matchedDish || known.length > 0) && (
          <p className="mt-0.5 truncate text-sm text-muted">
            {matchedDish ? (
              <>
                {t.site.card.has} <span className="font-medium text-ink">{pick(matchedDish.name, matchedDish.nameAr)}</span>
              </>
            ) : (
              known.join(" · ")
            )}
          </p>
        )}
        {status && (
          <p className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${status.open ? "text-fresh" : "text-muted"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-fresh" : "bg-muted"}`} aria-hidden />
            {status.text}
          </p>
        )}
      </div>

      <SaveButton variant="plain" slug={r.slug} name={name} className="relative z-10 self-start" />
    </motion.article>
    </div>
  );
}
