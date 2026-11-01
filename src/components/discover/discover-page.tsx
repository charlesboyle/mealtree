"use client";

import { useMemo } from "react";
import { AllRestaurantsEntry } from "@/components/all-restaurants-entry";
import { DiscoverHero } from "@/components/discover-hero";
import { DishCard } from "@/components/dish-card";
import { FairPromise } from "@/components/fair-promise";
import { NearbyTile } from "@/components/nearby-tile";
import { Rail } from "@/components/rail";
import { RestaurantCard } from "@/components/restaurant-card";
import { useI18n } from "@/i18n/client";
import { pickDishes } from "@/lib/discover";
import { byRating } from "@/lib/rating";
import { useDiscoverFilters } from "@/lib/use-discover-filters";
import type { Restaurant } from "@/lib/types";

/** Landing page: hero with search and moods, then rows of restaurants and dishes. */
export function DiscoverPage({ restaurants }: { restaurants: Restaurant[] }) {
  const { t } = useI18n();
  const { mood, setMood, moods } = useDiscoverFilters(restaurants);
  const r = t.discover.rails;

  const rails = useMemo(() => {
    const pool = restaurants.filter((x) => mood === "all" || moods.get(x.slug)?.includes(mood));
    const dishes = (test: Parameters<typeof pickDishes>[1]) => pickDishes(pool, test, 12);
    const withMood = (id: string) => pool.filter((x) => moods.get(x.slug)?.includes(id));
    return {
      pool,
      top: byRating(pool),
      popular: dishes((i) => Boolean(i.popular)),
      late: withMood("late-night"),
      spicy: dishes((i) => Boolean(i.tags?.includes("spicy"))),
      dateNight: withMood("date-night"),
      veggie: dishes((i) => Boolean(i.tags?.includes("vegetarian") || i.tags?.includes("vegan"))),
    };
  }, [restaurants, moods, mood]);

  const feature = useMemo(() => byRating(restaurants).find((x) => x.cover), [restaurants]);

  return (
    <main className="w-full bg-surface pb-16">
      <DiscoverHero mood={mood} onMoodChange={setMood} feature={feature} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {rails.top.length > 0 && (
          <Rail title={r.top} size="tile">
            {rails.top.map((x) => (
              <NearbyTile key={x.slug} restaurant={x} />
            ))}
          </Rail>
        )}
        <AllRestaurantsEntry restaurants={restaurants} />
        {rails.popular.length > 0 && (
          <Rail title={r.popular} subtitle={r.popularSub} size="dish">
            {rails.popular.map(({ restaurant, item }) => (
              <DishCard key={`${restaurant.slug}-${item.id}`} restaurant={restaurant} item={item} />
            ))}
          </Rail>
        )}
        {rails.late.length > 0 && (
          <Rail title={r.late} subtitle={r.lateSub} size="compact">
            {rails.late.map((x) => (
              <RestaurantCard key={x.slug} restaurant={x} compact />
            ))}
          </Rail>
        )}
        {rails.spicy.length > 0 && (
          <Rail title={r.spicy} subtitle={r.spicySub} size="dish">
            {rails.spicy.map(({ restaurant, item }) => (
              <DishCard key={`${restaurant.slug}-${item.id}`} restaurant={restaurant} item={item} />
            ))}
          </Rail>
        )}
        {rails.dateNight.length > 0 && (
          <Rail title={t.site.rails.dateNight} subtitle={t.site.rails.dateNightSub} size="compact">
            {rails.dateNight.map((x) => (
              <RestaurantCard key={x.slug} restaurant={x} compact />
            ))}
          </Rail>
        )}
        {rails.veggie.length > 0 && (
          <Rail title={r.vegetarian} subtitle={r.vegetarianSub} size="dish">
            {rails.veggie.map(({ restaurant, item }) => (
              <DishCard key={`${restaurant.slug}-${item.id}`} restaurant={restaurant} item={item} />
            ))}
          </Rail>
        )}
        <FairPromise />
      </div>
    </main>
  );
}
