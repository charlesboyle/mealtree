"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Height of the sticky chrome above the menu at the current width, plus breathing room. */
export function chromeOffset() {
  const w = window.innerWidth;
  if (w >= 1024) return 88; // site header only; the side nav replaces the tabs
  if (w >= 768) return 124; // site header + tabs
  return 100; // compact top bar + tabs
}

/** Scroll spy over section ids, and a smooth jump that doesn't fight the spy while it scrolls. */
export function useMenuScroll(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const lock = useRef<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    const list = key ? key.split("|") : [];
    let raf = 0;
    const measure = () => {
      if (lock.current) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - chromeOffset() - 8 <= 0) current = id;
      }
      if (atBottom && window.scrollY > 0) current = list.at(-1) ?? current;
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [key]);

  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    lock.current = id;
    setActive(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - chromeOffset(), behavior: reduce ? "auto" : "smooth" });
    const release = () => {
      lock.current = null;
      window.removeEventListener("scrollend", release);
    };
    window.addEventListener("scrollend", release);
    setTimeout(release, 1000);
  }, []);

  return { active: ids.includes(active) ? active : ids[0], jumpTo };
}
