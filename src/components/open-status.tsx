"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/format";
import { openStatus } from "@/lib/hours";
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

/** Rendered client-side only: open/closed depends on the viewer's clock. */
export function OpenStatus({
  hours,
  timezone,
  className,
  tone = "default",
}: {
  hours: Hours;
  timezone: string;
  className?: string;
  tone?: "default" | "onImage";
}) {
  const status = useOpenStatus(hours, timezone);
  if (!status) {
    return <span className={cn("skeleton inline-block h-4 w-28 rounded-full", className)} />;
  }
  const color = !status.open ? "text-danger" : status.soon ? "text-warning" : "text-positive";
  return (
    <span className={cn("inline-flex animate-fade items-center gap-1.5 whitespace-nowrap", className)}>
      <span
        className={cn(
          "size-1.5 rounded-full bg-current",
          tone === "onImage" ? (status.open ? "text-[#6ee7a8]" : "text-[#ff9c8a]") : color,
          status.open && "animate-pulse-dot",
        )}
      />
      <span className={tone === "onImage" ? "text-white/90" : "text-ink-2"}>
        <span className={cn("font-medium", tone === "onImage" ? "text-white" : color)}>
          {status.headline}
        </span>
        <span className="mx-1 opacity-50">·</span>
        {status.detail}
      </span>
    </span>
  );
}
