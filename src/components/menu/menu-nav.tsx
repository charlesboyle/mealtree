"use client";

import { List } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

/** How wide the tab list's edge fade gets. */
const FADE_PX = 28;

export type MenuTab = { id: string; label: string; count?: number };

/** Sticky category tabs for phones and tablets (the side nav takes over on desktop). */
export function MenuNav({
  tabs,
  activeId,
  onSelect,
  onOpenIndex,
}: {
  tabs: MenuTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onOpenIndex: () => void;
}) {
  const { t, dir } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  // Each edge fades in as you scroll away from it (0 at rest, full FADE_PX once FADE_PX has scrolled) and out as you
  // reach the other end, so the first and last tab are never washed out and the fade eases in instead of snapping.
  // Written straight to the style: it changes on every scroll frame and needs no re-render.
  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const pos = Math.abs(el.scrollLeft); // negative in RTL
    const start = Math.min(FADE_PX, pos);
    const end = Math.min(FADE_PX, Math.max(0, el.scrollWidth - el.clientWidth - pos));
    const mask = `linear-gradient(to ${dir === "rtl" ? "left" : "right"}, transparent, #000 ${start}px, #000 calc(100% - ${end}px), transparent)`;
    el.style.maskImage = mask;
    el.style.webkitMaskImage = mask;
  }, [dir]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, tabs]);

  // Center the active tab. Measured from rects so it works the same in RTL.
  useEffect(() => {
    const el = buttons.current.get(activeId);
    const container = scroller.current;
    if (!el || !container) return;
    const a = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    container.scrollBy({ left: a.left + a.width / 2 - (c.left + c.width / 2), behavior: "smooth" });
  }, [activeId]);

  if (!tabs.length) return null;
  return (
    <div className="sticky top-12 z-30 mt-4 bg-cream shadow-[0_6px_12px_-10px_rgba(47,33,41,0.25)] md:top-16 lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenIndex}
          aria-label={t.restaurant.allSections}
          className="-ms-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-opacity duration-150 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <List className="h-4 w-4" aria-hidden />
        </button>
        {/* The tab list runs on to the edge of the screen (cancelling the bar's side padding) and fades out at both ends. */}
        <nav aria-label={t.menu.sections} className="-me-4 flex min-w-0 flex-1 items-center gap-3 sm:-me-6 lg:-me-8">
          <div
            ref={scroller}
            onScroll={measure}
            className="no-scrollbar relative flex gap-7 overflow-x-auto pe-4 sm:pe-6 lg:pe-8"
          >
            {tabs.map((tab) => {
              const on = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    if (el) buttons.current.set(tab.id, el);
                    else buttons.current.delete(tab.id);
                  }}
                  type="button"
                  onClick={() => onSelect(tab.id)}
                  aria-current={on ? "true" : undefined}
                  className={cn(
                    "relative h-11 shrink-0 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink md:h-[52px]",
                    on ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {tab.label}
                  {on && (
                    <motion.span
                      layoutId="menu-tab"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 520, damping: 42 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
