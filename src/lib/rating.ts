import type { Restaurant } from "@/lib/types";

const PRIOR_WEIGHT = 20;
const PRIOR_MEAN = 4;

/**
 * Orders by rating, pulling scores based on few ratings toward the average so a
 * 5.0 from two people doesn't outrank a 4.6 from hundreds. Unrated ones go last. A rating with no count at all is a
 * manual override and is trusted as it is.
 */
export function byRating(restaurants: Restaurant[]): Restaurant[] {
  const score = (r: Restaurant) =>
    r.rating === undefined
      ? -1
      : r.ratingCount === undefined
        ? r.rating
        : (r.ratingCount * r.rating + PRIOR_WEIGHT * PRIOR_MEAN) / (r.ratingCount + PRIOR_WEIGHT);
  return [...restaurants].sort((a, b) => score(b) - score(a));
}
