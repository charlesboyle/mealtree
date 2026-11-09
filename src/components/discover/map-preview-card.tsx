"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { isPinned, projectToBox } from "@/lib/map";
import type { Restaurant } from "@/lib/types";

const W = 640;
const H = 220;

// The map library stays out of the homepage's first load: this chunk is fetched only once the card is near the screen.
const PreviewMap = dynamic(() => import("@/components/map/preview-map"), { ssr: false });

/** True from the first time the element comes within `margin` of the viewport. */
function useNearViewport<T extends Element>(margin: string) {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (!("IntersectionObserver" in window)) return; // the sketch stays
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin, near]);
  return { ref, near };
}

/**
 * Entry point from the landing page to the map. A dot sketch of where the restaurants are shows first;
 * once the card is near the screen the real map loads under it and takes over with a crossfade.
 * The whole card is one link (the title's stretched link), with the map's attribution kept above it.
 */
export function MapPreviewCard({ restaurants }: { restaurants: Restaurant[] }) {
  const { t, href } = useI18n();
  const reduced = useReducedMotion();
  const pinned = useMemo(() => restaurants.filter(isPinned), [restaurants]);
  const dots = useMemo(() => projectToBox(pinned, W, H, 24), [pinned]);
  const { ref, near } = useNearViewport<HTMLDivElement>("300px");
  const [ready, setReady] = useState(false);
  if (pinned.length < 3) return null;
  return (
    <article className="group relative mt-6 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line/70 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-float active:scale-[0.98]">
      {/* Geography never mirrors: east stays on the right in Arabic too. */}
      <div ref={ref} dir="ltr" className="relative h-32 bg-soft sm:h-40">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <pattern id="map-preview-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" className="stroke-line" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#map-preview-grid)" opacity="0.6" />
          {dots.map((d, i) => (
            <circle key={pinned[i].slug} cx={d.x} cy={d.y} r={7} className="fill-plum/70 stroke-white transition-colors duration-300 group-hover:fill-plum" strokeWidth={2.5} />
          ))}
        </svg>
        {near && (
          // Clicks pass through to the card's link; only the map's own attribution button takes them.
          <motion.div className="pointer-events-none absolute inset-0 z-20 bg-soft" initial={false} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.45, ease: "easeOut" }}>
            <PreviewMap points={pinned} onReady={() => setReady(true)} />
          </motion.div>
        )}
      </div>
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <Link
            href={href("/map")}
            className="block truncate text-[15px] font-semibold text-plum after:absolute after:inset-0 after:z-10 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-plum sm:text-base"
          >
            {t.map.previewTitle}
          </Link>
          <p className="truncate text-sm text-muted">{t.map.previewSub(pinned.length)}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft text-plum transition-[background-color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:bg-plum group-hover:text-white rtl:group-hover:-translate-x-0.5" aria-hidden>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      </div>
    </article>
  );
}
