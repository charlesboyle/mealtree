"use client";

import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "@/lib/map";

export type GeoPermission = "unknown" | "prompt" | "granted" | "denied";
export type GeoPosition = LatLng & { accuracy: number };
export type GeoResult = { position: GeoPosition } | { error: "denied" | "failed" };

/**
 * The visitor's position, only when asked for. Reading the permission state never prompts; `request` asks
 * once (no watching). The position lives in memory for this page only: it is not stored or sent anywhere.
 */
export function useLocation() {
  const [permission, setPermission] = useState<GeoPermission>("unknown");
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let status: PermissionStatus | undefined;
    let live = true;
    const sync = () => status && setPermission(status.state);
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((s) => {
        if (!live) return;
        status = s;
        sync();
        s.addEventListener("change", sync);
      })
      .catch(() => {});
    return () => {
      live = false;
      status?.removeEventListener("change", sync);
    };
  }, []);

  const request = useCallback(
    () =>
      new Promise<GeoResult>((resolve) => {
        if (!("geolocation" in navigator)) return resolve({ error: "failed" });
        setBusy(true);
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const next = { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy };
            setBusy(false);
            setPermission("granted");
            setPosition(next);
            resolve({ position: next });
          },
          (err) => {
            setBusy(false);
            if (err.code === err.PERMISSION_DENIED) setPermission("denied");
            resolve({ error: err.code === err.PERMISSION_DENIED ? "denied" : "failed" });
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
        );
      }),
    [],
  );

  return { permission, position, busy, request };
}
