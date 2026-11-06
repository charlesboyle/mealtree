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

/** Open Graph + Twitter tags for a page, so link previews carry the page's own title and description under the NOMM site name. */
export function social(locale: Locale, title: string, description: string, images?: { url: string; width?: number }[]) {
  return {
    openGraph: { title, description, siteName: "NOMM", type: "website" as const, locale: locale === "ar" ? "ar_AE" : "en_AE", images },
    twitter: { card: "summary_large_image" as const, title, description },
  };
}
