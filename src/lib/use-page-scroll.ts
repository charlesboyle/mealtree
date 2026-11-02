"use client";

import { useLayoutEffect } from "react";

// Module scope, so positions survive each page mounting its own shell.
const positions = new Map<string, number>();

// Back/forward is the only time a saved position applies; a fresh link visit starts at the top.
// Next fires popstate before it renders the destination, so a recent one marks the next route mount.
let poppedAt = -Infinity;
if (typeof window !== "undefined") window.addEventListener("popstate", () => (poppedAt = performance.now()));
const POP_WINDOW_MS = 3000;

/** Retains scroll per destination without keeping hidden pages mounted. */
export function usePageScroll(path: string) {
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const popped = performance.now() - poppedAt < POP_WINDOW_MS;
    poppedAt = -Infinity;
    // A #dish- deep link is positioned by the menu itself; never fight it.
    const deepLink = /^#dish-/.test(location.hash);
    const target = positions.get(path) ?? 0;
    const shouldRestore = popped && !deepLink;
    let frame = 0;
    let restoring = shouldRestore;
    const started = performance.now();
    const restore = () => {
      window.scrollTo({ top: target, behavior: "instant" });
      if (Math.abs(window.scrollY - target) > 1 && performance.now() - started < 1800) {
        frame = requestAnimationFrame(restore);
      } else {
        restoring = false;
      }
    };
    const record = () => {
      if (!restoring) positions.set(path, window.scrollY);
    };
    const stop = () => {
      restoring = false;
      cancelAnimationFrame(frame);
    };
    if (shouldRestore) restore();
    window.addEventListener("scroll", record, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("wheel", stop, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", record);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
      window.history.scrollRestoration = previous;
    };
  }, [path]);
}
