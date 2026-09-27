import type { I18n } from "@/i18n";
import type { MenuItem, MenuSource } from "./types";

/** "AED 18", "from AED 12" for dishes with several sizes, or the menu's note when unpriced. */
export function itemPriceLabel(item: MenuItem, i18n: I18n, currency = "AED") {
  if (item.price === null) return item.priceNote ?? i18n.t.price.ask;
  if (item.variants && item.variants.length > 1) {
    const prices = item.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? i18n.price(min, currency) : i18n.t.price.from(i18n.price(min, currency));
  }
  return i18n.price(item.price, currency);
}

/** Lowest price a diner could pay, for "under 20" filtering. */
export function itemMinPrice(item: MenuItem) {
  if (item.variants?.length) return Math.min(...item.variants.map((v) => v.price));
  return item.price;
}

/** Photos are either full https URLs or Unsplash photo ids (placeholder data). */
export function photoUrl(id: string, width: number) {
  if (/^https?:\/\//.test(id)) return id;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;
}

export function photoSrcSet(id: string, width: number) {
  if (/^https?:\/\//.test(id)) return undefined;
  return [1, 2, 3].map((d) => `${photoUrl(id, width * d)} ${d}x`).join(", ");
}

/**
 * UAE numbers become E.164: "04 321 7788" → +97143217788, "050 123 4567" →
 * +971501234567, "00971…" and "971…" are kept. Anything else is kept as typed.
 */
export function normalizePhone(input: string) {
  const digits = toLatinDigits(input).replace(/\D/g, "");
  const national = digits.startsWith("00971")
    ? digits.slice(5)
    : digits.startsWith("971")
      ? digits.slice(3)
      : digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  // Mobiles are 5X XXX XXXX; landlines are an area code (2–9) plus 7 digits.
  if (/^(5\d{8}|[2-9]\d{7})$/.test(national)) return `+971${national}`;
  return input.trim();
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** English labels for the admin tools. */
export const sourceLabel: Record<MenuSource, string> = {
  visit: "In-person visit",
  photos: "Menu photos",
  website: "Restaurant website",
  owner: "Restaurant owner",
};

/** ٠-٩ and ۰-۹ → 0-9, so "١٥" and "15" search the same. */
export function toLatinDigits(s: string) {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Folds text for matching: strips Latin accents, lowercases, and unifies
 * Arabic letter variants (أ إ آ → ا, ى → ي, ة → ه, ؤ → و, ئ → ي) and digits.
 * Arabic diacritics and tatweel are dropped, so "كُنافة" matches "كنافه".
 * Arabic is folded before NFD, which would otherwise split أ into ا + hamza.
 */
export function normalize(s: string) {
  return toLatinDigits(s)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
