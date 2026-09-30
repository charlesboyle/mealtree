"use client";

import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { CuisineGlyph } from "@/components/icons";
import { OpenStatus } from "@/components/open-status";
import { Photo } from "@/components/photo";
import { useI18n } from "@/i18n/client";
import { accentStyle } from "@/lib/accent";
import { cn } from "@/lib/format";
import { hasHours } from "@/lib/hours";
import { countItems } from "@/lib/search";
import type { Restaurant } from "@/lib/types";

/** A list row: thumbnail + text, the same on every screen size. */
export function RestaurantCard({ restaurant: r, priority }: { restaurant: Restaurant; priority?: boolean }) {
  const { t, pick, cuisines, priceLevel, href } = useI18n();
  const name = pick(r.name, r.nameAr);
  return (
    <Link
      data-accent
      href={href(`/r/${r.slug}`)}
      transitionTypes={["nav-forward"]}
      style={accentStyle(r.accent)}
      className="group flex items-center gap-4 py-3 outline-offset-4"
    >
      <Photo
        id={r.cover}
        alt=""
        width={400}
        priority={priority}
        fallback={<CuisineGlyph cuisine={r.cuisine} className="size-6 opacity-70" strokeWidth={1.6} />}
        className={cn(
          "size-18 shrink-0 rounded-lg",
          "transition-opacity duration-300 group-hover:opacity-90",
        )}
      />
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 text-md font-semibold text-ink">
          <span className="truncate">{name}</span>
          {r.claimed && <BadgeCheck className="size-4 shrink-0 fill-accent text-bg" strokeWidth={2} aria-label={t.card.verified} />}
        </h3>
        <p className="truncate text-sm text-ink-2">
          {cuisines(r.cuisine)} <span className="text-ink-3">·</span> {pick(r.neighborhood, r.neighborhoodAr)}
        </p>
        <p className="mt-0.5 flex items-center gap-2 truncate text-sm">
          {hasHours(r.hours) && (
            <>
              <OpenStatus hours={r.hours} timezone={r.timezone} />
              <span className="text-ink-3">·</span>
            </>
          )}
          <span className="text-ink-3">{priceLevel(r.priceLevel)}</span>
          <span className="text-ink-3">· {t.card.dishes(countItems(r))}</span>
        </p>
      </div>
    </Link>
  );
}
