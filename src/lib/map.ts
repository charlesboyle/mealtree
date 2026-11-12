import type { Restaurant } from "@/lib/types";

/** Pure map maths. Nothing here touches the map library, so the homepage preview and the tests stay light. */

export type LatLng = { lat: number; lng: number };
export type Pinned = Restaurant & LatLng;

/** Farther than this from every restaurant and the user is outside what nomm covers today. */
export const COVERAGE_KM = 60;

const EARTH_KM = 6371.0088;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Only restaurants with a map pin (both coordinates) appear on the map. */
export function isPinned(r: Restaurant): r is Pinned {
  return typeof r.lat === "number" && typeof r.lng === "number";
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** South-west and north-east corners as [lng, lat] pairs (the map library's order); null for no points. */
export function boundsOf(points: LatLng[]): [[number, number], [number, number]] | null {
  if (!points.length) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const { lat, lng } of points) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [
    [west, south],
    [east, north],
  ];
}

/** Distance to the closest of the points, or null when there are none. */
export function nearestKm(from: LatLng, points: LatLng[]) {
  let best: number | null = null;
  for (const p of points) {
    const km = distanceKm(from, p);
    if (best === null || km < best) best = km;
  }
  return best;
}

/** True when the user is farther than `limitKm` from every point (or there are none to be near). */
export function isOutsideCoverage(from: LatLng, points: LatLng[], limitKm = COVERAGE_KM) {
  const km = nearestKm(from, points);
  return km === null || km > limitKm;
}

/** The items nearest first, each with its distance in km. Equal distances keep their order. */
export function sortByDistance<T extends LatLng>(items: T[], from: LatLng): { item: T; km: number }[] {
  return items.map((item) => ({ item, km: distanceKm(from, item) })).sort((a, b) => a.km - b.km);
}

/**
 * Plots points into a width x height box (equirectangular, longitude scaled by cos(latitude) so shapes
 * are not stretched) leaving `padding` free on every side. The points keep their relative layout and are
 * centred; a single point lands in the middle.
 */
export function projectToBox(points: LatLng[], width: number, height: number, padding = 0): { x: number; y: number }[] {
  const bounds = boundsOf(points);
  if (!bounds) return [];
  const [[west, south], [east, north]] = bounds;
  const k = Math.cos(rad((south + north) / 2));
  const spanX = (east - west) * k;
  const spanY = north - south;
  const innerW = Math.max(0, width - padding * 2);
  const innerH = Math.max(0, height - padding * 2);
  const scale = spanX === 0 && spanY === 0 ? 0 : Math.min(spanX ? innerW / spanX : Infinity, spanY ? innerH / spanY : Infinity);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  return points.map(({ lat, lng }) => ({
    x: offsetX + (lng - west) * k * scale,
    y: offsetY + (north - lat) * scale,
  }));
}

/** A rectangle on the map, in degrees. `west > east` means it crosses the antimeridian. */
export type Box = { west: number; south: number; east: number; north: number };

/** True when the point lies inside the box (edges included). */
export function inBox(p: LatLng, box: Box) {
  if (p.lat < box.south || p.lat > box.north) return false;
  return box.west <= box.east ? p.lng >= box.west && p.lng <= box.east : p.lng >= box.west || p.lng <= box.east;
}

/**
 * Reorders items for a map the visitor has moved: those inside `box` first, nearest to `centre` first,
 * then the rest in the order they came in. Items for which `first` is true and that are in view lead the
 * in-view group. Nothing is dropped; equal distances keep their order.
 */
export function orderByView<T extends LatLng>(items: T[], box: Box, centre: LatLng, first?: (item: T) => boolean): T[] {
  const inside: { item: T; km: number; lead: boolean }[] = [];
  const outside: T[] = [];
  for (const item of items) {
    if (inBox(item, box)) inside.push({ item, km: distanceKm(centre, item), lead: Boolean(first?.(item)) });
    else outside.push(item);
  }
  inside.sort((a, b) => Number(b.lead) - Number(a.lead) || a.km - b.km);
  return [...inside.map((i) => i.item), ...outside];
}
