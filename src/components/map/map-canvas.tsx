"use client";

import { Map as MapLibreMap, Marker, type MapMouseEvent, type PaddingOptions } from "maplibre-gl";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createBaseMap, localizeLabels } from "@/components/map/maplibre-setup";
import { Photo } from "@/components/photo";
import { RestaurantImage } from "@/components/restaurant-image";
import { useI18n } from "@/i18n/client";
import type { Locale } from "@/i18n";
import { cn, THUMB_WIDTH } from "@/lib/format";
import type { Box, LatLng, Pinned } from "@/lib/map";
import { pressable } from "@/lib/motion";

const MAX_FIT_ZOOM = 15;
/** Opening on one restaurant (`r=`): close enough to read the streets, wide enough to see what's nearby. */
const START_ZOOM = 13.5;

export type PinData = {
  restaurant: Pinned;
  /** The dish a search matched, once its price and photo are known. */
  dish?: { image?: string; price: string };
};

type Bounds = [[number, number], [number, number]];

/** Where the free part of the map is, as pixels covered by the top bar, card row or side panel. */
export type MapPadding = Required<PaddingOptions>;

/** What the visitor can see after moving the map themselves: the free part of the map, and its middle. */
export type VisibleArea = { box: Box; centre: LatLng };

/** Pixel offset that puts a point in the middle of the uncovered area rather than the middle of the map. */
const offsetFor = (p: MapPadding): [number, number] => [(p.left - p.right) / 2, (p.top - p.bottom) / 2];

/**
 * The map itself, loaded only on /map (see map-page). Pins are real buttons placed with MapLibre markers;
 * everything else (selection, results, location) lives in the page and comes in as props.
 */
export default function MapCanvas({
  pins,
  selected,
  onSelect,
  onDeselect,
  onUserMove,
  fit,
  start,
  padding,
  keepVisible,
  user,
  flyToUser,
}: {
  pins: PinData[];
  selected: string | null;
  onSelect: (slug: string) => void;
  /** Empty map tapped. */
  onDeselect: () => void;
  /** The visitor panned or zoomed (never our own camera moves). */
  onUserMove: (area: VisibleArea) => void;
  /** Refit to `bounds` whenever `key` changes (not on the first render: the map opens on them already). */
  fit: { key: string; bounds: Bounds | null };
  /** Open centred and zoomed on this pin instead of fitting `fit.bounds`. */
  start: LatLng | null;
  padding: MapPadding;
  /** Only move the camera to a selected pin when it is hidden behind the top bar, card row or panel. */
  keepVisible: boolean;
  user: LatLng | null;
  /** Ease to the user when `n` changes. */
  flyToUser: { lat: number; lng: number; n: number } | null;
}) {
  const { t, locale, dir } = useI18n();
  const reduced = useReducedMotion();
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const latest = useRef({ fit, start, padding, onDeselect, onUserMove });
  useEffect(() => {
    latest.current = { fit, start, padding, onDeselect, onUserMove };
  });

  // Created when the container mounts and removed when it goes, with the first props as its opening view.
  const container = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const { fit, start, padding } = latest.current;
    const m = createBaseMap({
      container: el,
      dragRotate: false,
      pitchWithRotate: false,
      maxPitch: 0,
      ...(start
        ? { center: [start.lng, start.lat] as [number, number], zoom: START_ZOOM }
        : fit.bounds
          ? { bounds: fit.bounds, fitBoundsOptions: { padding, maxZoom: MAX_FIT_ZOOM } }
          : { center: [54.37, 24.47] as [number, number], zoom: 11 }),
    });
    m.touchZoomRotate.disableRotation();
    m.keyboard.disableRotation();
    // Arriving by navigation, the container can still be settling (page swap, entrance animation) when the
    // opening view is computed, which leaves the results off-centre. Refit once loaded, unless the visitor
    // has already moved the map.
    m.once("load", () => {
      const { fit: f, start: s, padding: p } = latest.current;
      if (s || !f.bounds || m.isMoving()) return;
      m.resize();
      m.fitBounds(f.bounds, { padding: p, maxZoom: MAX_FIT_ZOOM, duration: 0 });
    });

    // Empty map tapped. Pins are DOM buttons inside the map, so their clicks reach this too: skip those.
    m.on("click", (e: MapMouseEvent) => {
      if (e.originalEvent.target instanceof Element && e.originalEvent.target.closest(".maplibregl-marker")) return;
      latest.current.onDeselect();
    });
    // A move the visitor made, not one of ours (easeTo/fitBounds carry no `originalEvent`). Judged when the
    // move starts: a scroll-wheel or pinch zoom ends without an `originalEvent`, but starts with one.
    // A window resize carries one too, but is not a move.
    const byUser = (e: { originalEvent?: Event }) => Boolean(e.originalEvent) && e.originalEvent?.type !== "resize";
    let userMove = false;
    m.on("movestart", (e) => {
      userMove = byUser(e);
    });
    m.on("moveend", (e) => {
      const mine = userMove || byUser(e);
      userMove = false;
      if (!mine) return;
      const p = latest.current.padding;
      const width = m.getContainer().clientWidth;
      const height = m.getContainer().clientHeight;
      if (width - p.left - p.right <= 0 || height - p.top - p.bottom <= 0) return;
      const nw = m.unproject([p.left, p.top]);
      const se = m.unproject([width - p.right, height - p.bottom]);
      const centre = m.unproject([(p.left + width - p.right) / 2, (p.top + height - p.bottom) / 2]);
      latest.current.onUserMove({ box: { west: nw.lng, north: nw.lat, east: se.lng, south: se.lat }, centre: { lat: centre.lat, lng: centre.lng } });
    });
    setMap(m);
    return () => {
      m.remove();
      setMap(null);
    };
  }, []);

  // Labels in the page language, business labels hidden.
  useEffect(() => (map ? localizeLabels(map, locale) : undefined), [map, locale]);

  const duration = reduced ? 0 : 600;

  // New results: ease to fit them all.
  const fitted = useRef(fit.key);
  useEffect(() => {
    if (!map || fitted.current === fit.key) return;
    fitted.current = fit.key;
    if (fit.bounds) map.fitBounds(fit.bounds, { padding: latest.current.padding, maxZoom: MAX_FIT_ZOOM, duration });
  }, [map, fit, duration]);

  // A different pin selected (tap or card): bring it into the free part of the map.
  const lastSelected = useRef(selected);
  useEffect(() => {
    if (!map || selected === lastSelected.current) return;
    lastSelected.current = selected;
    const pin = pins.find((p) => p.restaurant.slug === selected);
    if (!pin) return;
    const { lat, lng } = pin.restaurant;
    const p = latest.current.padding;
    if (keepVisible) {
      const at = map.project([lng, lat]);
      const { clientWidth: width, clientHeight: height } = map.getContainer();
      if (at.x > p.left && at.x < width - p.right && at.y > p.top && at.y < height - p.bottom) return;
    }
    map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 13.5), offset: offsetFor(p), duration });
  }, [map, selected, pins, keepVisible, duration]);

  // "Show my location" found you inside the area we cover.
  const lastFly = useRef(flyToUser?.n);
  useEffect(() => {
    if (!map || !flyToUser || flyToUser.n === lastFly.current) return;
    lastFly.current = flyToUser.n;
    map.easeTo({ center: [flyToUser.lng, flyToUser.lat], zoom: Math.max(map.getZoom(), 14), offset: offsetFor(latest.current.padding), duration });
  }, [map, flyToUser, duration]);

  return (
    // The map never mirrors; only the UI around it does. Pins set their own direction.
    <div dir="ltr" className="absolute inset-0">
      {/* MapLibre's CSS makes its container `position: relative`, so size it explicitly. */}
      <div ref={container} role="region" aria-label={t.map.title} className="size-full" />
      {map &&
        pins.map((pin) => (
          <PinMarker key={pin.restaurant.slug} map={map} pin={pin} selected={pin.restaurant.slug === selected} onSelect={onSelect} locale={locale} dir={dir} />
        ))}
      {map && user && <UserMarker map={map} at={user} label={t.map.youAreHere} />}
    </div>
  );
}

/** A DOM element on the map at a position; React draws into it through a portal. */
function useMarker(map: MapLibreMap, at: LatLng, zIndex: number, dir?: string) {
  const [el] = useState(() => document.createElement("div"));
  const marker = useRef<Marker | null>(null);
  useEffect(() => {
    marker.current = new Marker({ element: el }).setLngLat([at.lng, at.lat]).addTo(map);
    return () => {
      marker.current?.remove();
      marker.current = null;
    };
  }, [map, el, at.lat, at.lng]);
  // Restyled in place, so a pin that gets selected keeps its keyboard focus.
  useEffect(() => {
    const root = marker.current?.getElement();
    if (!root) return;
    root.style.zIndex = String(zIndex);
    if (dir) root.dir = dir;
  }, [zIndex, dir, map, at.lat, at.lng]);
  return el;
}

function PinMarker({
  map,
  pin: { restaurant: r, dish },
  selected,
  onSelect,
  locale,
  dir,
}: {
  map: MapLibreMap;
  pin: PinData;
  selected: boolean;
  onSelect: (slug: string) => void;
  locale: Locale;
  dir: string;
}) {
  const reduced = useReducedMotion();
  const el = useMarker(map, r, selected ? 20 : dish ? 10 : 0, dir);
  const name = locale === "ar" && r.nameAr?.trim() ? r.nameAr : r.name;
  // Dot, dish pill and selected pill swap with a short scale/fade both ways; reduced motion swaps instantly.
  const spring = { type: "spring" as const, duration: 0.3, bounce: 0.3 };
  const motionProps = reduced
    ? { initial: false as const, transition: { duration: 0 } }
    : { initial: { scale: 0.7, opacity: 0 }, animate: { scale: 1, opacity: 1, transition: spring }, exit: { scale: 0.7, opacity: 0, transition: { duration: 0.12 } } };

  return createPortal(
    <motion.button
      type="button"
      aria-label={name}
      aria-pressed={selected}
      onClick={() => onSelect(r.slug)}
      {...pressable(reduced, 0.88)}
      className="grid min-h-8 min-w-8 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum"
    >
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.span key="selected" {...motionProps} className="flex items-center gap-1.5 rounded-full bg-plum p-1 pe-3 text-white shadow-float ring-2 ring-white">
            <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-white/20">
              <RestaurantImage restaurant={r} width={96} />
            </span>
            <span className="max-w-36 truncate text-xs font-semibold">{name}</span>
          </motion.span>
        ) : dish ? (
          <motion.span key="dish" {...motionProps} className="flex items-center gap-1 rounded-full bg-white p-0.5 pe-2 shadow-pill ring-1 ring-line">
            {dish.image && <Photo id={dish.image} alt="" width={THUMB_WIDTH} className="size-6 shrink-0 rounded-full" />}
            <span className={cn("whitespace-nowrap text-2xs font-semibold text-plum", !dish.image && "ps-1.5")}>{dish.price}</span>
          </motion.span>
        ) : (
          <motion.span key="dot" {...motionProps} className="block size-3 rounded-full border-2 border-white bg-muted shadow-sm" />
        )}
      </AnimatePresence>
    </motion.button>,
    el,
  );
}

function UserMarker({ map, at, label }: { map: MapLibreMap; at: LatLng; label: string }) {
  const el = useMarker(map, at, 30);
  return createPortal(<span role="img" aria-label={label} className="block size-4 rounded-full border-2 border-white bg-plum shadow-float ring-8 ring-plum/15" />, el);
}
