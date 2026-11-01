"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { RestaurantImage } from "@/components/restaurant-image";
import { useI18n } from "@/i18n/client";
import { useOpenCount } from "@/lib/use-open-state";
import type { Restaurant } from "@/lib/types";

/** Entry point from the landing page to the full, filterable list. */
export function AllRestaurantsEntry({ restaurants }: { restaurants: Restaurant[] }) {
  const { t, href } = useI18n();
  const open = useOpenCount(restaurants);
  const thumbs = restaurants.slice(0, 4);
  return (
    <Link
      href={href("/restaurants")}
      className="group mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line/70 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum sm:p-5"
    >
      <div className="flex shrink-0 -space-x-3 rtl:space-x-reverse" aria-hidden>
        {thumbs.map((r) => (
          <span key={r.slug} className="relative block h-11 w-11 overflow-hidden rounded-full bg-soft ring-2 ring-white sm:h-12 sm:w-12">
            <RestaurantImage restaurant={r} width={120} />
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-plum sm:text-base">{t.site.allEntry.title}</p>
        <p className="truncate text-sm text-muted">{t.site.allEntry.sub(restaurants.length, open ?? undefined)}</p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft text-plum transition-[background-color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:bg-plum group-hover:text-white rtl:group-hover:-translate-x-0.5">
        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </span>
    </Link>
  );
}
