/** Public pages are served in English and Arabic under /en and /ar. */
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Remembers an explicit choice from the language toggle. */
export const LOCALE_COOKIE = "mt_lang";

export const hasLocale = (value: string | undefined): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);

export const dirOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

/** BCP 47 tags for Intl. UAE menus print Western digits, so Arabic keeps them too. */
export const intlLocale: Record<Locale, string> = { en: "en-AE", ar: "ar-AE-u-nu-latn" };

/** Prefix an app path ("/r/slug") with the locale. */
export function localePath(locale: Locale, path: string) {
  return `/${locale}${path === "/" ? "" : path}`;
}

/** Swap (or add) the locale prefix of a pathname. */
export function switchLocalePath(pathname: string, to: Locale) {
  const rest = pathname.replace(/^\/(en|ar)(?=\/|$)/, "");
  return localePath(to, rest || "/");
}

/** Best match from an Accept-Language header, falling back to English. */
export function negotiateLocale(header: string | null): Locale {
  if (!header) return defaultLocale;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .filter((x) => x.lang && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) if (hasLocale(lang)) return lang;
  return defaultLocale;
}
