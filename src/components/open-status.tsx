"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import { describeStatus, openStatus } from "@/lib/hours";
import type { Hours } from "@/lib/types";

// One shared minute ticker for every badge on the page.
let minute = 0;
const subs = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;
function subscribe(cb: () => void) {
  subs.add(cb);
  if (!interval) {
    minute = Math.floor(Date.now() / 60000);
    interval = setInterval(() => {
      minute = Math.floor(Date.now() / 60000);
      subs.forEach((s) => s());
    }, 15000);
  }
  return () => {
    subs.delete(cb);
    if (!subs.size) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

export function useMinute() {
  return useSyncExternalStore(
    subscribe,
    () => minute || Math.floor(Date.now() / 60000),
    () => 0,
  );
}

export function useOpenStatus(hours: Hours, timezone: string) {
  const m = useMinute();
  return m ? openStatus(hours, timezone, new Date(m * 60000)) : null;
}

/** "Open · until 2 AM". Rendered client-side only: it depends on the viewer's clock. */
export function OpenStatus({ hours, timezone, className }: { hours: Hours; timezone: string; className?: string }) {
  const i18n = useI18n();
  const status = useOpenStatus(hours, timezone);
  if (!status) return <span className={cn("skeleton inline-block h-3.5 w-24 rounded", className)} />;
  const { headline, detail } = describeStatus(status, i18n);
  const color = !status.open ? "text-danger" : status.soon ? "text-warning" : "text-positive";
  return (
    <span className={cn("animate-fade whitespace-nowrap text-ink-2", className)}>
      <span className={cn("font-medium", color)}>{headline}</span>
      <span className="mx-1 text-ink-3">·</span>
      {detail}
    </span>
  );
}
