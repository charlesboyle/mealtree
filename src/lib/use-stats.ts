"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "./supabase/client";
import { normalizeStats } from "./supabase/database";
import type { RestaurantStats } from "./types";

/** Starts from the server's copy (up to 5 minutes old) and refreshes it in the browser. */
export function useStats(slug: string, initial: RestaurantStats) {
  const [stats, setStats] = useState(initial);
  useEffect(() => {
    const db = getBrowserClient();
    if (!db) return;
    let live = true;
    db.rpc("restaurant_stats", { p_slug: slug }).then(({ data, error }) => {
      if (live && !error && data) setStats(normalizeStats(data));
    });
    return () => {
      live = false;
    };
  }, [slug]);
  return stats;
}
