"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

const SIZES = {
  tile: "basis-[31%] sm:basis-[22%] md:basis-[17%] lg:basis-[12.5%]",
  card: "basis-[86%] sm:basis-[48%] md:basis-[32%] lg:basis-[24%]",
  compact: "basis-[58%] sm:basis-[40%] md:basis-[30%] lg:basis-[23%]",
  dish: "basis-[38%] sm:basis-[28%] md:basis-[22%] lg:basis-[16.5%]",
} as const;

/** A titled, snap-scrolling row. Arrows appear on desktop; touch just swipes. */
export function Rail({
  title,
  subtitle,
  size = "card",
  children,
}: {
  title: string;
  subtitle?: string;
  size?: keyof typeof SIZES;
  children: React.ReactNode;
}) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [can, setCan] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // scrollLeft is 0 at the start and negative going on in RTL, so use its magnitude.
    const x = Math.abs(el.scrollLeft);
    setCan({ start: x > 4, end: x + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (locale === "ar" ? -1 : 1) * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow =
    "flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition-[transform,box-shadow,opacity] duration-150 ease-out hover:scale-105 hover:shadow-pill disabled:pointer-events-none disabled:opacity-30";

  return (
    <section aria-label={title} className="mt-6 first:mt-0">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-plum sm:text-[22px]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="hidden shrink-0 gap-2 md:flex">
          <button type="button" className={arrow} onClick={() => scroll(-1)} disabled={!can.start} aria-label={t.rail.back(title)}>
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
          <button type="button" className={arrow} onClick={() => scroll(1)} disabled={!can.end} aria-label={t.rail.forward(title)}>
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        onScroll={update}
        className="no-scrollbar -mx-4 -mb-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-8 pt-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
      >
        {Children.map(children, (child) => (
          <div className={cn("min-w-0 shrink-0 snap-start", SIZES[size])}>{child}</div>
        ))}
      </div>
    </section>
  );
}
