"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

/** Cycles through craving cues, holding still while the field is in use. */
export function useRotatingPlaceholder(paused = false, interval = 2800): string {
  const { t } = useI18n();
  const cues = t.site.cues;
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % cues.length), interval);
    return () => window.clearInterval(timer);
  }, [paused, interval, cues.length]);
  return cues[index % cues.length];
}
