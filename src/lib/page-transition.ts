/**
 * Small module-level memory shared by the site template and the pages that animate their own arrival.
 * Pure state, no React: it lives for the browser session and is empty on the server.
 */

// Set once the first page has mounted, so only later (client) navigations animate. Pages that animate
// their own entrance read it while rendering: the first page is shipped fully visible.
let mounted = false;
export const markMounted = () => {
  mounted = true;
};
export const hasMounted = () => mounted;

export type Arrival = "list" | "map";
const FRESH_MS = 3000;
let last: { kind: Arrival; at: number } | null = null;

/** Called as a page starts its exit: the next page in `kind` takes over its own entrance. */
export function markArrival(kind: Arrival) {
  last = { kind, at: performance.now() };
}

/** True when the page now arriving was just announced by the page leaving it (a few seconds' grace). */
export function arrivingFrom(kind: Arrival) {
  return mounted && last !== null && last.kind === kind && performance.now() - last.at < FRESH_MS;
}

/** The map page always enters on its own; the list only when it was left through a map transition. */
export function ownsEntrance(pathname: string) {
  if (/\/map\/?$/.test(pathname)) return true;
  return /\/restaurants\/?$/.test(pathname) && arrivingFrom("list");
}
