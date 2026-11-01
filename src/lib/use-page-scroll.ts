"use client";

import { useLayoutEffect } from "react";

// Module scope, so positions survive each page mounting its own shell.
const positions = new Map<string, number>();

/** Retains scroll per destination without keeping hidden pages mounted. */
export function usePageScroll(path: string) {
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const target = positions.get(path) ?? 0;
    let frame = 0;
    let restoring = true;
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
    restore();
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
