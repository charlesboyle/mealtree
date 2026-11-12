"use client";

import { Compass, Heart, LayoutList } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { EXIT, SPRING } from "@/lib/motion";
import { countSaved, useSaved } from "@/lib/saved";
import { useRoute } from "@/lib/use-route";

/**
 * Stable bottom navigation for phones; it shrinks to icons while scrolling down. On pages that hide it
 * (restaurant pages, the map) it fades out moving down, and fades back in moving up.
 */
export function TabBar({ hidden = false, knownSlugs }: { hidden?: boolean; knownSlugs: string[] }) {
  const { t, href } = useI18n();
  const route = useRoute();
  const { slugs } = useSaved();
  const savedCount = countSaved(slugs, knownSlugs);
  const [compact, setCompact] = useState(false);
  const reduced = useReducedMotion();
  const tabs = [
    { to: "/", label: t.tabs.discover, icon: Compass },
    { to: "/restaurants", label: t.tabs.restaurants, icon: LayoutList },
    { to: "/saved", label: t.tabs.saved, icon: Heart },
  ];

  useEffect(() => {
    let previousY = window.scrollY;
    let frame = requestAnimationFrame(() => {
      previousY = window.scrollY;
      setCompact(previousY > 120);
    });
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextY = window.scrollY;
        const delta = nextY - previousY;
        if (nextY < 80) {
          setCompact(false);
          previousY = nextY;
        } else if (Math.abs(delta) >= 12) {
          setCompact(delta > 0 && nextY > 120);
          previousY = nextY;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [route]);

  return (
    <nav
      aria-label={t.common.mainNav}
      aria-hidden={hidden || undefined}
      inert={hidden}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] md:hidden"
    >
      <motion.div
        initial={false}
        animate={hidden ? { opacity: 0, y: reduced ? 0 : 28 } : { opacity: 1, y: 0 }}
        transition={hidden ? EXIT : { ...SPRING, delay: 0.08 }}
        className={`flex items-center rounded-full border border-surface/80 bg-surface/[0.98] p-1 shadow-tabs ring-1 ring-plum/[0.06] backdrop-blur-xl backdrop-saturate-150 ${hidden ? "" : "pointer-events-auto"}`}
      >
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = route === to;
          return (
            <Link
              key={to}
              href={href(to)}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              onClick={(event) => {
                if (active) event.preventDefault();
              }}
              className="relative flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-plum/[0.07]"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span
                className={`relative flex flex-col items-center justify-center transition-[width,height,color] duration-300 ease-out motion-reduce:transition-none ${compact ? "h-10 w-14" : "h-12 w-[84px]"} ${
                  active ? "text-tomato" : "text-plum"
                }`}
              >
                <span className="relative">
                  <Icon className={`h-[22px] w-[22px] ${active && to === "/saved" ? "fill-tomato" : ""}`} strokeWidth={active ? 2.25 : 1.9} aria-hidden />
                  {to === "/saved" && savedCount > 0 && (
                    <span className="absolute -end-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-tomato px-1 text-[10px] font-bold text-white">
                      {savedCount}
                    </span>
                  )}
                </span>
                <span
                  className={`overflow-hidden whitespace-nowrap text-[10px] font-semibold transition-[max-height,opacity] duration-200 motion-reduce:transition-none ${compact ? "max-h-0 opacity-0" : "max-h-4 opacity-100"}`}
                >
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}
