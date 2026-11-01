"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";
import Link from "next/link";
import { RestaurantImage } from "@/components/restaurant-image";
import { useI18n } from "@/i18n/client";
import { useOpenState } from "@/lib/use-open-state";
import type { Restaurant } from "@/lib/types";

/** Square photo tile used in the Top rated row. */
export function NearbyTile({ restaurant: r }: { restaurant: Restaurant }) {
  const { pick, href } = useI18n();
  const status = useOpenState(r);
  return (
    <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.12 }}>
      <Link
        href={href(`/r/${r.slug}`)}
        className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-soft shadow-card">
          <RestaurantImage restaurant={r} width={300} className="transition-transform duration-300 ease-out group-hover:scale-[1.05]" />
          {status && !status.open && (
            <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-white/95 px-2 py-0.5 text-center text-2xs font-semibold text-ink">
              {status.text}
            </span>
          )}
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-ink">{pick(r.name, r.nameAr)}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
          {r.rating !== undefined && (
            <>
              <Star className="h-3 w-3 shrink-0 fill-tomato text-tomato" aria-hidden />
              <span className="font-medium text-ink">{r.rating.toFixed(1)}</span>·{" "}
            </>
          )}
          {pick(r.neighborhood, r.neighborhoodAr)}
        </p>
      </Link>
    </motion.div>
  );
}
