export const OPEN_SEARCH_EVENT = "nomm:open-search";

/** Opens the phone search sheet from anywhere (the header and the hero field). */
export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}
