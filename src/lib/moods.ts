import {
  Flame,
  IceCreamCone,
  MoonStar,
  Salad,
  Sandwich,
  Soup,
  Users,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { opensLate } from "@/lib/discover";
import { itemMinPrice } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

/** A mood tab is shown only when at least this many restaurants fit it. */
export const MIN_MOOD_RESTAURANTS = 3;

export const MOODS: { id: string; icon: LucideIcon }[] = [
  { id: "all", icon: UtensilsCrossed },
  { id: "quick", icon: Sandwich },
  { id: "spicy", icon: Flame },
  { id: "comfort", icon: Soup },
  { id: "date-night", icon: Wine },
  { id: "veggie", icon: Salad },
  { id: "late-night", icon: MoonStar },
  { id: "group", icon: Users },
  { id: "sweet", icon: IceCreamCone },
];

const text = (r: Restaurant) =>
  [r.name, r.nameAr, r.tagline, ...r.cuisine, ...r.menus.flatMap((m) => m.sections.map((s) => s.name))]
    .join(" ")
    .toLowerCase();

/**
 * Moods a restaurant fits, worked out from its menu, hours and price level.
 * Nothing is curated by hand, so a mood only appears when the data says so.
 */
export function restaurantMoods(r: Restaurant): string[] {
  const items = r.menus.flatMap((m) => m.sections.flatMap((s) => s.items));
  const words = text(r);
  const prices = items.map(itemMinPrice).filter((p): p is number => p !== null);
  const median = prices.length ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null;
  const moods: string[] = [];
  if (r.priceLevel === 1 || (median !== null && median <= 20) || /cafeteria|express|snack|sandwich|shawarma|juice|karak/.test(words))
    moods.push("quick");
  if (items.some((i) => i.tags?.includes("spicy"))) moods.push("spicy");
  if (/biryani|curry|soup|stew|haleem|harees|pasta|pizza|ramen|noodle|machboos|mandi/.test(words)) moods.push("comfort");
  if (r.priceLevel >= 3) moods.push("date-night");
  const veg = items.filter((i) => i.tags?.includes("vegetarian") || i.tags?.includes("vegan")).length;
  if (veg >= 4 || /vegetarian|vegan|salad/.test(words)) moods.push("veggie");
  if (opensLate(r.hours)) moods.push("late-night");
  if (/platter|family|sharing|mandi|grill|bbq|buffet/.test(words)) moods.push("group");
  if (/dessert|sweet|ice cream|bakery|cake|kunafa|knafeh|waffle|crepe/.test(words)) moods.push("sweet");
  return moods;
}
