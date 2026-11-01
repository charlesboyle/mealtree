"use client";

import { useCallback } from "react";
import { useMinute, useOpenStatus } from "@/components/open-status";
import { useI18n } from "@/i18n/client";
import { describeStatus, hasHours, openStatus } from "@/lib/hours";
import type { Restaurant } from "@/lib/types";

/** Whether a restaurant is open right now and the line to show ("Open · until 11 PM"). Null until the clock is known. */
export function useOpenState(r: Pick<Restaurant, "hours" | "timezone">) {
  const i18n = useI18n();
  const status = useOpenStatus(r.hours, r.timezone);
  if (!hasHours(r.hours) || !status) return null;
  const { headline, detail } = describeStatus(status, i18n);
  return { open: status.open, text: detail ? `${headline} · ${detail}` : headline };
}

/** How many of the given restaurants are open right now; null until the viewer's clock is known. */
export function useOpenCount(restaurants: Pick<Restaurant, "hours" | "timezone">[]) {
  const minute = useMinute();
  if (!minute) return null;
  const now = new Date(minute * 60000);
  return restaurants.filter((r) => hasHours(r.hours) && openStatus(r.hours, r.timezone, now).open).length;
}

/** A predicate for "open right now" that follows the shared minute clock; false until the clock is known. */
export function useIsOpen() {
  const minute = useMinute();
  return useCallback(
    (r: Pick<Restaurant, "hours" | "timezone">) => minute > 0 && hasHours(r.hours) && openStatus(r.hours, r.timezone, new Date(minute * 60000)).open,
    [minute],
  );
}
