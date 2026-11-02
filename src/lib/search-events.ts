export const OPEN_SEARCH_EVENT = "nomm:open-search";
export const OPEN_DISH_EVENT = "nomm:open-dish";

/**
 * Tells the restaurant page in view to open a dish. A <Link> to `#dish-…` on the page already showing
 * that restaurant changes the URL without firing `hashchange`, so the page would never notice.
 */
export function announceDish(slug: string, itemId: string) {
  window.dispatchEvent(new CustomEvent(OPEN_DISH_EVENT, { detail: { slug, itemId } }));
}

let proxy: HTMLInputElement | null = null;

/** Drops the stand-in field once the real one has taken focus (or after a moment if it never does). */
export function releaseSearchProxy() {
  proxy?.remove();
  proxy = null;
}

/**
 * Opens the phone search sheet from anywhere (the header and the hero field).
 *
 * iOS only raises the keyboard for focus that happens inside the tap itself, but the sheet's field doesn't exist
 * until React renders it. So focus a throwaway field right now, inside the tap; the sheet then moves focus to
 * the real field and the keyboard stays up.
 */
export function openSearch() {
  if (window.matchMedia("(max-width: 767px)").matches) {
    releaseSearchProxy();
    proxy = document.createElement("input");
    proxy.type = "search";
    proxy.setAttribute("aria-hidden", "true");
    proxy.tabIndex = -1;
    proxy.style.cssText = "position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none";
    document.body.appendChild(proxy);
    proxy.focus({ preventScroll: true });
    window.setTimeout(releaseSearchProxy, 1000);
  }
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}
