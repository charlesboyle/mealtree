import type { DietTag, MenuItem, MenuSource } from "./types";

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** "$18" for whole dollars, "$4.50" otherwise — never "$4.5". */
export function formatPrice(n: number) {
  return Number.isInteger(n) ? usdWhole.format(n) : usdCents.format(n);
}

export function itemPriceLabel(item: MenuItem) {
  if (item.price === null) return item.priceNote ?? "Ask";
  if (item.variants && item.variants.length > 1) {
    const prices = item.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatPrice(min) : `${formatPrice(min)}+`;
  }
  return formatPrice(item.price);
}

/** Lowest price a diner could pay, for "under $X" filtering. */
export function itemMinPrice(item: MenuItem) {
  if (item.variants?.length) return Math.min(...item.variants.map((v) => v.price));
  return item.price;
}

export function photoUrl(id: string, width: number) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;
}

export function photoSrcSet(id: string, width: number) {
  return [1, 2, 3].map((d) => `${photoUrl(id, width * d)} ${d}x`).join(", ");
}

export function priceLevelLabel(level: number) {
  return "$".repeat(level);
}

export function formatPhone(e164: string) {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export function formatVerified(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const sourceLabel: Record<MenuSource, string> = {
  visit: "In-person visit",
  photos: "Menu photos",
  website: "Restaurant website",
  owner: "Restaurant owner",
};

export const dietLabel: Record<DietTag, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-free": "Gluten-free",
  spicy: "Spicy",
  nuts: "Contains nuts",
};

export const dietShort: Record<DietTag, string> = {
  vegetarian: "V",
  vegan: "VG",
  "gluten-free": "GF",
  spicy: "Spicy",
  nuts: "Nuts",
};

export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
