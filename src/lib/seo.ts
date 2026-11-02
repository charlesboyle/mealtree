import { locales, type Locale } from "@/i18n/config";

/** The site's origin without a trailing slash: the configured URL, else Vercel's production domain, else local dev. */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/^https?:\/\//, "");
  return (explicit || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/+$/, "");
}

/** Canonical URL and hreflang links for a page that exists in every language. `path` is "" for the home page. */
export function pageAlternates(locale: Locale, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: { ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])), "x-default": `/en${path}` },
  };
}

/** Pages that are personal or only a step in a flow: kept out of search results. */
export const NO_INDEX = { index: false, follow: true } as const;
