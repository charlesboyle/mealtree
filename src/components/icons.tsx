import { createElement } from "react";
import {
  Beef,
  CalendarCheck,
  Coffee,
  CookingPot,
  Fish,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Flame,
  Globe,
  Leaf,
  MessageCircle,
  Nut,
  ShoppingBag,
  Sprout,
  WheatOff,
  type LucideIcon,
  type LucideProps,
  Phone,
} from "lucide-react";
import type { DietTag, LinkKind } from "@/lib/types";

/** Lucide dropped brand marks, so Instagram is drawn here in the same style. */
export function InstagramIcon(props: LucideProps) {
  const { size = 24, strokeWidth = 2, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export const linkIcon: Record<LinkKind, LucideIcon | typeof InstagramIcon> = {
  reserve: CalendarCheck,
  order: ShoppingBag,
  instagram: InstagramIcon,
  website: Globe,
  whatsapp: MessageCircle,
  phone: Phone,
};

export const dietIcon: Record<DietTag, LucideIcon> = {
  vegetarian: Leaf,
  vegan: Sprout,
  "gluten-free": WheatOff,
  spicy: Flame,
  nuts: Nut,
};

const CUISINE_ICON: [RegExp, LucideIcon][] = [
  [/coffee|café|cafe|bakery/i, Coffee],
  [/shawarma|sandwich/i, Sandwich],
  [/grill|kebab|afghan|pakistani|iranian|persian/i, Beef],
  [/japanese|izakaya|ramen|sushi/i, Soup],
  [/seafood|fish/i, Fish],
  [/lebanese|levantine|salad/i, Salad],
  [/emirati|arabic|indian|keralan/i, CookingPot],
];

function cuisineIcon(cuisine: string[]): LucideIcon {
  for (const c of cuisine) for (const [re, icon] of CUISINE_ICON) if (re.test(c)) return icon;
  return UtensilsCrossed;
}

/** A category glyph for restaurants without a photo, like a maps app would show. */
export function CuisineGlyph({ cuisine, ...props }: LucideProps & { cuisine: string[] }) {
  return createElement(cuisineIcon(cuisine), { "aria-hidden": true, ...props });
}
