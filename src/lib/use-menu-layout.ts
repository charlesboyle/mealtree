"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { LayoutOverride, MenuLayout } from "./menu-layout";

const KEY = "nomm:menu-layout";
const listeners = new Set<() => void>();
/** Last pick when storage refuses writes (private mode), so the toggle still works until the tab closes. */
let memory: LayoutOverride = null;

function read(): LayoutOverride {
  try {
    const v = localStorage.getItem(KEY);
    return v === "list" || v === "grid" ? v : memory;
  } catch {
    return memory;
  }
}

function write(layout: MenuLayout) {
  memory = layout;
  try {
    localStorage.setItem(KEY, layout);
  } catch {
    // Storage unavailable: the choice lasts for this page view only.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * The diner's list/grid pick, kept in this browser for every menu. `null` means "never chose": menus
 * decide per section. The server snapshot is `null`, so server HTML already carries the automatic layout.
 */
export function useMenuLayout() {
  const override = useSyncExternalStore(subscribe, read, () => null);
  const choose = useCallback((layout: MenuLayout) => write(layout), []);
  return [override, choose] as const;
}
