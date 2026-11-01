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

/** Wide list row with a larger photo; used on the Saved page. */
export function RestaurantRow({ restaurant: r }: { restaurant: Restaurant }) {
  const { t, pick, href, cuisines, priceLevel } = useI18n();
  const status = useOpenState(r);
  const name = pick(r.name, r.nameAr);
  const known = knownFor(r).map((i) => pick(i.name, i.nameAr));
  const meta = [cuisines(r.cuisine.slice(0, 1)), pick(r.neighborhood, r.neighborhoodAr), priceLevel(r.priceLevel)].filter(Boolean).join(" · ");
  return (
    <motion.article
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-start gap-2 py-3"
    >
      <Link
        href={href(`/r/${r.slug}`)}
        className="group flex min-w-0 flex-1 gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-soft sm:h-[88px] sm:w-[120px]">
          <RestaurantImage restaurant={r} width={240} />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-[15px] font-semibold text-ink group-hover:underline group-hover:underline-offset-2">{name}</h3>
            {r.rating !== undefined && (
              <span className="flex shrink-0 items-center gap-1 text-sm text-ink">
                <Star className="h-3 w-3 fill-ink text-ink" aria-hidden />
                {r.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-muted">{meta}</p>
          {known.length > 0 && (
            <p className="mt-1 truncate text-sm text-ink">
              <span className="text-muted">{t.site.card.knownFor}</span> {known.join(", ")}
            </p>
          )}
          {status && (
            <p className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${status.open ? "text-fresh" : "text-muted"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-fresh" : "bg-muted"}`} aria-hidden />
              {status.text}
            </p>
          )}
        </div>
      </Link>
      <SaveButton variant="plain" slug={r.slug} name={name} />
    </motion.article>
  );
}
