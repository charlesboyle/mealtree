"use client";

/**
 * Anonymous usage events for the owner dashboard: page views (with where they
 * came from), link clicks and dish opens. Nothing identifies the visitor; the
 * database keeps only the kind, the dish or button, utm_source, the referring
 * hostname and the page language.
 *
 * Sent with `fetch(…, { keepalive })` straight to the `track_event` RPC so a
 * click that leaves the page (tel:, maps, delivery apps) still gets recorded.
 */
import type { Locale } from "@/i18n/config";
import type { LinkKind } from "@/lib/types";

/** Which button was tapped: the restaurant's own links plus call and directions. */
export type TrackLink = LinkKind | "call" | "maps";
type Event =
  | { kind: "view" }
  | { kind: "dish_open"; itemId: string }
  | { kind: "link_click"; link: TrackLink };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function storage(kind: "local" | "session") {
  try {
    return kind === "local" ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Skip events that would inflate an owner's numbers: automated browsers
 * (unless a test opts in), and the owner looking at their own page.
 */
function shouldSkip(slug: string) {
  if (!url || !key) return true;
  const local = storage("local");
  if (navigator.webdriver && !local?.getItem("mealtree:track-in-tests")) return true;
  return !!local?.getItem(`mealtree:owner-token:${slug}`);
}

/** utm_source, else the referring site's hostname (never our own). */
function origin() {
  const params = new URLSearchParams(location.search);
  const source = params.get("utm_source")?.toLowerCase().slice(0, 40) ?? null;
  let referrer: string | null = null;
  try {
    const host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    if (host && host !== location.hostname) referrer = host.slice(0, 80);
  } catch {}
  return { source, referrer };
}

export function track(slug: string, locale: Locale, event: Event) {
  if (typeof window === "undefined" || shouldSkip(slug)) return;
  // One view per restaurant per browser session, so reloads and back-navigation don't count twice.
  if (event.kind === "view") {
    const session = storage("session");
    const seen = `mealtree:viewed:${slug}`;
    if (session?.getItem(seen)) return;
    session?.setItem(seen, "1");
  }
  const { source, referrer } = origin();
  fetch(`${url}/rest/v1/rpc/track_event`, {
    method: "POST",
    keepalive: true,
    headers: {
      apikey: key!,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Content-Profile": "mealtree",
    },
    body: JSON.stringify({
      p_slug: slug,
      p_kind: event.kind,
      p_item_id: event.kind === "dish_open" ? event.itemId : null,
      p_link_kind: event.kind === "link_click" ? event.link : null,
      p_source: source,
      p_referrer: referrer,
      p_locale: locale,
    }),
  }).catch(() => {});
}
