"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { RestaurantImage } from "@/components/restaurant-image";
import { useI18n } from "@/i18n/client";
import { useOpenCount } from "@/lib/use-open-state";
import type { Restaurant } from "@/lib/types";

/** Entry point from the landing page to the full, filterable list. Desktop only: on phones the bottom tab bar has Restaurants. */
export function AllRestaurantsEntry({ restaurants }: { restaurants: Restaurant[] }) {
  const { t, href } = useI18n();
  const open = useOpenCount(restaurants);
  const thumbs = restaurants.slice(0, 4);
  return (
    <Link
      href={href("/restaurants")}
      className="group/lift group mt-6 hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum md:block"
    >
      <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line/70 transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lift:-translate-y-0.5 group-hover/lift:shadow-float sm:p-5">
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
      </div>
    </Link>
  );
}
