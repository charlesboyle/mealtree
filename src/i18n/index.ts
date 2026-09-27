import { dirOf, intlLocale, localePath, type Locale } from "./config";
import { dictionaries } from "./dictionaries";
import * as f from "./format";

/**
 * Everything a component needs to render in one language: strings, formatters,
 * and a picker for bilingual content fields (name / nameAr, …).
 */
export function makeI18n(locale: Locale) {
  return {
    locale,
    dir: dirOf(locale),
    intl: intlLocale[locale],
    t: dictionaries[locale],
    /** Locale-prefixed app path. */
    href: (path: string) => localePath(locale, path),
    /** Arabic text when viewing in Arabic and it exists, else the English original. */
    pick: (en: string, ar?: string | null) => (locale === "ar" && ar?.trim() ? ar : en),
    /** The other language's text, if it differs (shown as a secondary line). */
    alt: (en: string, ar?: string | null) => {
      if (!ar?.trim() || ar.trim() === en.trim()) return undefined;
      return locale === "ar" ? en : ar;
    },
    price: (n: number, currency = "AED") => f.formatPrice(n, locale, currency),
    currency: (currency = "AED") => f.currencyLabel(currency, locale),
    time: (hhmm: string) => f.formatTime(hhmm, locale),
    ranges: (r: [string, string][]) => f.formatRanges(r, locale),
    date: (iso: string) => f.formatDate(iso, locale),
    compact: (n: number) => f.formatCompact(n, locale),
    number: f.formatNumber,
    priceLevel: (level: number) => f.priceLevelLabel(level, locale),
    cuisine: (c: string) => f.cuisineLabel(c, locale),
    cuisines: (list: string[]) => list.map((c) => f.cuisineLabel(c, locale)).join(" · "),
  };
}

export type I18n = ReturnType<typeof makeI18n>;
export { locales, hasLocale, type Locale } from "./config";
