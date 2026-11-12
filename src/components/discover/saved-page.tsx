"use client";

import { AnimatePresence } from "motion/react";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { RestaurantImage } from "@/components/restaurant-image";
import { RestaurantRow } from "@/components/restaurant-row";
import { useI18n } from "@/i18n/client";
import { useOpenBags, useStoredBagSlugs } from "@/lib/bag";
import { useFullMenus } from "@/lib/use-full-menus";
import { useSaved } from "@/lib/saved";
import type { Restaurant } from "@/lib/types";

/** Bags in progress and hearted restaurants; both live in this browser only. */
export function SavedPage({ restaurants }: { restaurants: Restaurant[] }) {
  const { t, pick, href, price } = useI18n();
  const s = t.site.savedPage;
  const { slugs } = useSaved();
  const saved = restaurants.filter((r) => slugs.includes(r.slug));
  // Bag totals need the whole menu; only restaurants with a bag fetch theirs.
  const bagSlugs = useStoredBagSlugs(restaurants.map((r) => r.slug));
  const bags = useOpenBags(useFullMenus(restaurants, bagSlugs));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-plum sm:text-3xl">{t.savedPage.title}</h1>

      {bags.length > 0 && (
        <section aria-labelledby="open-bags" className="mt-8">
          <h2 id="open-bags" className="text-lg font-bold text-plum">
            {s.bags}
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {bags.map(({ restaurant: r, names, count, total }) => (
              <li key={r.slug}>
                <Link
                  href={href(`/r/${r.slug}`)}
                  className="group/lift block rounded-2xl"
                >
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-line/70 transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lift:-translate-y-0.5 group-hover/lift:shadow-float">
                  <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-soft">
                    <RestaurantImage restaurant={r} width={160} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-plum">{pick(r.name, r.nameAr)}</p>
                    <p className="truncate text-sm text-muted">{names.map((i) => pick(i.name, i.nameAr)).join(", ")}</p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="flex items-center justify-end gap-1 text-sm font-semibold text-plum">
                      <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                      {count}
                    </p>
                    <p className="text-sm tabular-nums text-muted">{price(total, r.currency)}</p>
                  </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="saved-spots" className="mt-10">
        <h2 id="saved-spots" className="text-lg font-bold text-plum">
          {s.restaurants}
        </h2>
        <p className="mt-1 text-sm text-muted">{s.count(saved.length)}</p>
        {saved.length > 0 ? (
          <div className="mt-2 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {saved.map((r) => (
                <RestaurantRow key={r.slug} restaurant={r} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState icon={Heart} title={s.emptyTitle} body={s.emptyBody}>
              <Link
                href={href("/")}
                className="inline-flex h-10 items-center rounded-full bg-tomato px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-tomato-dark"
              >
                {s.browse}
              </Link>
            </EmptyState>
          </div>
        )}
      </section>
    </main>
  );
}
