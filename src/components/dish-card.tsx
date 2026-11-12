"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { CuisineGlyph } from "@/components/icons";
import { DietTags } from "@/components/diet-tags";
import { Photo } from "@/components/photo";
import { PriceTag } from "@/components/price-tag";
import { useI18n } from "@/i18n/client";
import type { MenuItem, Restaurant } from "@/lib/types";

/** Photo card for one dish, linking to it on its restaurant's page. */
export function DishCard({ restaurant: r, item }: { restaurant: Restaurant; item: MenuItem }) {
  const { pick, href } = useI18n();
  return (
    <div className="group/lift h-full">
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70 transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lift:-translate-y-0.5 group-hover/lift:shadow-float"
    >
      <Photo
        id={item.image ?? r.cover}
        alt=""
        width={320}
        fallback={<CuisineGlyph cuisine={r.cuisine} className="size-8 opacity-70" strokeWidth={1.6} />}
        className="aspect-[4/3] w-full bg-soft"
      />
      <div className="flex flex-1 flex-col p-3">
        <Link
          href={href(`/r/${r.slug}#dish-${item.id}`)}
          className="block after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ink"
        >
          <h3 className="truncate text-sm font-semibold text-ink">{pick(item.name, item.nameAr)}</h3>
          <p className="mt-0.5 truncate text-xs text-muted">
            {pick(r.name, r.nameAr)} · {pick(r.neighborhood, r.neighborhoodAr)}
          </p>
        </Link>
        <div className="mt-auto flex items-center gap-1.5 pt-2.5">
          <PriceTag item={item} currency={r.currency} className="text-sm font-semibold tabular-nums text-ink" />
          <DietTags tags={item.tags} />
        </div>
      </div>
    </motion.div>
    </div>
  );
}
