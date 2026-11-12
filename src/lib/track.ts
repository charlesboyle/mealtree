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
import posthog from "posthog-js";
import type { Locale } from "@/i18n/config";
import type { MenuLayout } from "@/lib/menu-layout";
import type { LinkKind } from "@/lib/types";

/** Which button was tapped: the restaurant's own links plus call and directions. */
export type TrackLink = LinkKind | "call" | "maps";
type Event =
  | { kind: "view" }
  | { kind: "dish_open"; itemId: string }
  | { kind: "link_click"; link: TrackLink }
  | { kind: "menu_layout"; layout: MenuLayout };

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
  return !url || !key || skipVisitor(slug);
}

/** The visitor-based part of `shouldSkip`, for events that don't go through Supabase (surveys). `slug` may be empty. */
function skipVisitor(slug: string) {
  const local = storage("local");
  if (navigator.webdriver && !local?.getItem("mealtree:track-in-tests")) return true;
  return !!slug && !!local?.getItem(`mealtree:owner-token:${slug}`);
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

/**
 * Sends one PostHog survey event (see surveys.ts) and says whether it went out, so the form can fall back to
 * email when PostHog isn't loaded (ad blockers are common). Skipped visitors (the owner, automated browsers)
 * count as delivered so they see the normal thank-you. In dev PostHog is never initialised: the payload is logged
 * and delivery is faked; set localStorage `nomm:survey-offline` to rehearse the email fallback.
 */
export function sendSurvey(event: "survey shown" | "survey sent" | "survey dismissed", properties: Record<string, unknown>, slug = "") {
  if (typeof window === "undefined") return false;
  const dev = process.env.NODE_ENV !== "production";
  if (dev) console.info("[survey]", event, properties);
  if (dev) return !storage("local")?.getItem("nomm:survey-offline");
  if (skipVisitor(slug)) return true;
  if (!posthog.__loaded) return false;
  posthog.capture(event, properties);
  return true;
}

/**
 * `menu_submission_sent`: an owner sent their menu through the form. Only where from, the language and how many
 * files (see menuSubmissionEventProps), never the name or number. Logged in dev; skipped for automated browsers.
 */
export function trackMenuSubmission(properties: { source: string; locale: string; file_count: number }) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return console.info("[event] menu_submission_sent", properties);
  if (skipVisitor("")) return;
  posthog.capture("menu_submission_sent", properties);
}

export function track(slug: string, locale: Locale, event: Event) {
  if (typeof window === "undefined") return;
  if (shouldSkip(slug)) return;
  // PostHog only: a list/grid pick is not part of the owner's dashboard, so it never reaches track_event.
  if (event.kind === "menu_layout") {
    posthog.capture("menu_layout_changed", { restaurant_slug: slug, layout: event.layout, locale });
    return;
  }
  if (event.kind === "dish_open") {
    posthog.capture("menu_item_opened", { restaurant_slug: slug, menu_item_id: event.itemId, locale });
  } else if (event.kind === "link_click") {
    posthog.capture("restaurant_link_clicked", { restaurant_slug: slug, link_kind: event.link, locale });
  }
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
