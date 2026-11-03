/** How a menu section shows its dishes: text rows with a small photo, or a grid of photo cards. */
export type MenuLayout = "list" | "grid";

/** What the diner picked with the toggle; `null` leaves it to `autoLayout`. */
export type LayoutOverride = MenuLayout | null;

/** A section reads as a grid once this share of its dishes (3 in 5) has a photo. */
const GRID_SHARE = { photos: 3, of: 5 };
/** A lone photo is not enough to carry a grid. */
const GRID_MIN_PHOTOS = 2;

type Dish = { image?: string };

export function photoCount(items: Dish[]) {
  return items.filter((i) => i.image).length;
}

/** Grid for sections that are mostly photos. Judge the whole section, never the search results, so it can't flip as the diner types. */
export function autoLayout(items: Dish[]): MenuLayout {
  const photos = photoCount(items);
  return photos >= GRID_MIN_PHOTOS && photos * GRID_SHARE.of >= items.length * GRID_SHARE.photos ? "grid" : "list";
}

/**
 * The layout one section renders with. A text search is always a list, since cards drop the
 * description and a match in it would show nothing. "Grid" turns any section with a photo into a grid.
 */
export function sectionLayout(items: Dish[], override: LayoutOverride, searching: boolean): MenuLayout {
  if (searching || override === "list") return "list";
  if (override === "grid") return photoCount(items) > 0 ? "grid" : "list";
  return autoLayout(items);
}
