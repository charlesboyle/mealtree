import { AttributionControl, Map as MapLibreMap, setWorkerUrl, type ExpressionSpecification, type MapOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Locale } from "@/i18n";

/**
 * Everything the full map and the homepage preview share, so a fix to MapLibre's setup lives in one place.
 * Import this only from code that loads in the browser on demand (it pulls in the map library).
 */

// Muted base map (no business labels); free OpenFreeMap tiles. Attribution stays on.
export const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// MapLibre looks for its worker next to its own file, which the bundler renames and moves. Point it at
// the worker (one self-contained file) emitted as an asset instead. Must run before the first map exists.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

export type AttributionSide = "bottom-left" | "bottom-right";

/** The page-direction-aware corner for attribution: the end side is for the page's own buttons. */
export const attributionSide = (): AttributionSide => (document.documentElement.dir === "rtl" ? "bottom-right" : "bottom-left");

/** A map on the shared style with the attribution control (compact, folded to its ⓘ button). */
export function createBaseMap(options: Omit<MapOptions, "style" | "attributionControl">, side: AttributionSide = attributionSide()) {
  const map = new MapLibreMap({ ...options, style: STYLE_URL, attributionControl: false });
  map.addControl(new AttributionControl({ compact: true }), side);
  // Compact attribution opens expanded and would cover the page's own buttons; fold it on load.
  map.once("load", () => map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));
  return map;
}

/**
 * Labels in the page language, falling back to the local name; business labels hidden if the style ever
 * has them. Returns a cleanup.
 */
export function localizeLabels(map: MapLibreMap, locale: Locale) {
  const label: ExpressionSpecification =
    locale === "ar" ? ["coalesce", ["get", "name:ar"], ["get", "name"]] : ["coalesce", ["get", "name:en"], ["get", "name_en"], ["get", "name:latin"], ["get", "name"]];
  const apply = () => {
    for (const layer of map.getStyle().layers) {
      if (layer.type !== "symbol") continue;
      if ("source-layer" in layer && layer["source-layer"] === "poi") map.setLayoutProperty(layer.id, "visibility", "none");
      else if (JSON.stringify(layer.layout?.["text-field"] ?? "").includes("name")) map.setLayoutProperty(layer.id, "text-field", label);
    }
  };
  // `style.load` fires once the style is parsed, before the first tiles draw, so the default labels never flash.
  if (map.isStyleLoaded()) apply();
  else map.once("style.load", apply);
  return () => {
    map.off("style.load", apply);
  };
}
