import type { Hours, MenuItem, MenuSection, Restaurant } from "@/lib/types";

export const item = (over: Partial<MenuItem> & Pick<MenuItem, "id" | "name">): MenuItem => ({
  price: 10,
  ...over,
});

export const section = (id: string, items: MenuItem[], over: Partial<MenuSection> = {}): MenuSection => ({
  id,
  name: id,
  items,
  ...over,
});

export const emptyHours = (): Hours => ({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });

export const restaurant = (slug: string, sections: MenuSection[], over: Partial<Restaurant> = {}): Restaurant => ({
  slug,
  name: slug,
  tagline: "",
  cuisine: [],
  priceLevel: 2,
  neighborhood: "Al Reem",
  address: "Abu Dhabi",
  currency: "AED",
  phone: "+97143217788",
  timezone: "Asia/Dubai",
  accent: "#000000",
  hours: emptyHours(),
  links: [],
  claimed: false,
  source: "menu",
  verifiedAt: "2026-01-01",
  googleMenuLink: false,
  menus: [{ id: "m", name: "Menu", sections }],
  ...over,
});
