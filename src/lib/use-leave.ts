"use client";

import { useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Arrival, markArrival } from "@/lib/page-transition";

/** How long a page plays its exit before navigating. */
export const LEAVE_MS = 220;

/**
 * Two-step navigation: flag `leaving` so the page can play a short exit, then navigate. Reduced motion
 * navigates at once. Pass the click event from a real `<Link>` so modified clicks (cmd, ctrl, shift,
 * middle button) keep their normal behaviour and only plain clicks take the animated route.
 */
export function useLeave() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  /** Plays the exit, then runs `then`. */
  const leave = useCallback(
    (then: () => void, arrive?: Arrival) => {
      if (leaving) return;
      if (arrive) markArrival(arrive);
      if (reduced) return then();
      setLeaving(true);
      timers.current.push(
        setTimeout(then, LEAVE_MS),
        // Still here a moment later (navigation went nowhere): show the page again.
        setTimeout(() => setLeaving(false), LEAVE_MS + 1500),
      );
    },
    [leaving, reduced],
  );

  const go = useCallback(
    (href: string, options?: { event?: MouseEvent; arrive?: Arrival }) => {
      const e = options?.event;
      if (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
      e?.preventDefault();
      leave(() => router.push(href), options?.arrive);
    },
    [leave, router],
  );

  return { leaving, go, leave };
}
