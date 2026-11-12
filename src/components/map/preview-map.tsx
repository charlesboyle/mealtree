"use client";

import { useEffect, useRef } from "react";
import { createBaseMap, localizeLabels } from "@/components/map/maplibre-setup";
import { useI18n } from "@/i18n/client";
import { boundsOf, type LatLng } from "@/lib/map";

const PLUM = "#2f2129";
const PADDING = 28;

/**
 * The homepage card's real map: the same base map as /map, not interactive, fitted to every pin, with the
 * pins drawn as a circle layer (no DOM markers). Loaded on demand by map-preview-card.
 */
export default function PreviewMap({ points, onReady }: { points: LatLng[]; onReady: () => void }) {
  const { locale } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  const pointsRef = useRef(points);
  useEffect(() => {
    ready.current = onReady;
    pointsRef.current = points;
  });

  useEffect(() => {
    const el = box.current;
    const bounds = boundsOf(pointsRef.current);
    if (!el || !bounds) return;
    const fit = (duration = 0) => map.fitBounds(bounds, { padding: PADDING, maxZoom: 13, duration });
    const map = createBaseMap({ container: el, interactive: false, bounds, fitBoundsOptions: { padding: PADDING, maxZoom: 13 } }, "bottom-right");
    const stopLabels = localizeLabels(map, locale);
    map.on("resize", () => fit());
    map.once("load", () => {
      map.addSource("pins", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: pointsRef.current.map((p) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })),
        },
      });
      map.addLayer({ id: "pins", type: "circle", source: "pins", paint: { "circle-radius": 3.5, "circle-color": PLUM, "circle-opacity": 0.85, "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.25 } });
      // Tiles painted: safe to fade the sketch out.
      map.once("idle", () => ready.current());
    });
    return () => {
      stopLabels();
      map.remove();
    };
  }, [locale]);

  return <div ref={box} className="size-full" />;
}
