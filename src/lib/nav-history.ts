// Back/forward fires popstate before Next renders the destination (see use-page-scroll), so a recent one marks the next route change.
let poppedAt = -Infinity;
if (typeof window !== "undefined") window.addEventListener("popstate", () => (poppedAt = performance.now()));
const POP_WINDOW_MS = 3000;

let cameByLink = false;

/** Called by the site frame on every route change: remembers whether this page was reached by following a link on the site. */
export function noteRouteChange() {
  cameByLink = performance.now() - poppedAt > POP_WINDOW_MS;
}

/** True when the page in view was reached from another page of this site, so history "back" stays on the site. First loads and back/forward arrivals are not. */
export function cameFromSite() {
  return cameByLink;
}
