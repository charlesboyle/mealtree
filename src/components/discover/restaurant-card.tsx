"use client";

import { BadgeCheck, Camera } from "lucide-react";
import Link from "next/link";
import { OpenStatus } from "@/components/open-status";
import { Photo } from "@/components/photo";
import { accentStyle } from "@/lib/accent";
import { cn, priceLevelLabel } from "@/lib/format";
import { countItems, countPhotos } from "@/lib/search";
import type { Restaurant } from "@/lib/types";

export function RestaurantCard({
  restaurant: r,
  index = 0,
  className,
}: {
  restaurant: Restaurant;
  index?: number;
  className?: string;
}) {
  const photos = countPhotos(r);
  return (
    <Link
      data-accent
      href={`/r/${r.slug}`}
      style={{ ...accentStyle(r.accent), animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className={cn("group block animate-rise rounded-[26px] outline-offset-4", className)}
    >
      <div className="relative overflow-hidden rounded-[22px] ring-1 ring-line">
        <Photo
          id={r.cover}
          alt={r.name}
          width={480}
          priority={index < 2}
          className="aspect-[16/10] w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
          iconSize={32}
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {photos > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              <Camera className="size-3" strokeWidth={2.2} /> {photos}
            </span>
          )}
        </div>
      </div>
      <div className="px-1 pt-3">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-ink">{r.name}</h3>
          {r.claimed && <BadgeCheck className="size-4 shrink-0 fill-accent text-bg" strokeWidth={2} aria-label="Verified" />}
        </div>
        <p className="mt-0.5 truncate text-[13.5px] text-ink-2">
          {r.cuisine.join(" · ")} <span className="text-ink-3">·</span> {priceLevelLabel(r.priceLevel)}{" "}
          <span className="text-ink-3">·</span> {countItems(r)} dishes
        </p>
        <OpenStatus hours={r.hours} timezone={r.timezone} className="mt-1.5 text-[12.5px]" />
      </div>
    </Link>
  );
}
