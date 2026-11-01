import { locales, type Locale } from "@/i18n/config";

/** Canonical URL and hreflang links for a page that exists in every language. `path` is "" for the home page. */
export function pageAlternates(locale: Locale, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: { ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])), "x-default": `/en${path}` },
  };
}

/** Pages that are personal or only a step in a flow: kept out of search results. */
export const NO_INDEX = { index: false, follow: true } as const;
