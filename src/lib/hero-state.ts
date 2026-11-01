"use client";

import { useSyncExternalStore } from "react";

let past = false;
const listeners = new Set<() => void>();

/** Set by the landing hero once its search field has scrolled out of view, so the header can show its own. */
export function setHeroPast(next: boolean) {
  if (past === next) return;
  past = next;
  listeners.forEach((l) => l());
}

export function useHeroPast() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => past,
    () => false,
  );
}
