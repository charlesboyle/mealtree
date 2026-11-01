"use client";

import { motion } from "motion/react";
import { ArrowRight, Search, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MoodRail } from "@/components/mood-rail";
import { RestaurantImage } from "@/components/restaurant-image";
import { useI18n } from "@/i18n/client";
import { setHeroPast } from "@/lib/hero-state";
import { openSearch } from "@/lib/search-events";
import { useOpenState } from "@/lib/use-open-state";
import { useRotatingPlaceholder } from "@/lib/use-rotating-placeholder";
import type { Restaurant } from "@/lib/types";

export function DiscoverHero({ mood, onMoodChange, feature }: { mood: string; onMoodChange: (id: string) => void; feature?: Restaurant }) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const cue = useRotatingPlaceholder(focused || query.length > 0);
  const anchor = useRef<HTMLDivElement>(null);

  // Tell the header when this search field has scrolled away, so it can show its own.
  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroPast(!e.isIntersecting && e.boundingClientRect.bottom < 56), { rootMargin: "-56px 0px 0px 0px" });
    io.observe(el);
    return () => {
      io.disconnect();
      setHeroPast(false);
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(href(q ? `/restaurants?q=${encodeURIComponent(q)}` : "/restaurants"));
  };

  return (
    <section className="bg-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-6 pt-6 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 lg:px-8 lg:pb-12 lg:pt-14">
        <div className="min-w-0">
          <h1 className="text-[36px] font-bold leading-[1.05] tracking-[-0.025em] text-plum sm:text-[52px] lg:text-[60px]">
            {t.site.hero.line1}
            <br /> {t.site.hero.line2}
          </h1>
          <div ref={anchor} className="mt-6 max-w-xl sm:mt-8">
            {/* Phone: opens the full-screen search, where the area can be picked. */}
            <button
              type="button"
              onClick={openSearch}
              className="flex h-14 w-full items-center gap-3 rounded-full bg-white ps-5 pe-2 text-start shadow-pill ring-1 ring-line/70 active:shadow-card md:hidden"
            >
              <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
              <span className="sr-only">{t.site.searchPrompt}</span>
              <span key={cue} className="flex-1 truncate text-[15px] text-muted animate-[cue-in_300ms_ease-out]" aria-hidden>
                {cue}
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tomato text-white">
                <ArrowRight className="h-5 w-5 rtl:rotate-180" strokeWidth={2.25} aria-hidden />
              </span>
            </button>

            <form
              role="search"
              onSubmit={submit}
              className="relative hidden h-16 items-center rounded-full bg-white ps-6 pe-2 shadow-pill ring-1 ring-line/70 transition-shadow duration-150 focus-within:shadow-float hover:shadow-float md:flex"
            >
              <label htmlFor="hero-search" className="sr-only">
                {t.site.searchPrompt}
              </label>
              <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
              <input
                id="hero-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={cue}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-ink placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.12 }}
                aria-label={t.site.search}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tomato text-white transition-[transform,background-color] duration-150 ease-out hover:scale-105 hover:bg-tomato-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
              >
                <ArrowRight className="h-5 w-5 rtl:rotate-180" strokeWidth={2.25} />
              </motion.button>
            </form>
          </div>
        </div>

        {feature && <FeatureCard restaurant={feature} />}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MoodRail value={mood} onChange={onMoodChange} />
      </div>
    </section>
  );
}

function FeatureCard({ restaurant: r }: { restaurant: Restaurant }) {
  const { t, pick, href, cuisines } = useI18n();
  const status = useOpenState(r);
  const meta = [cuisines(r.cuisine.slice(0, 1)), pick(r.neighborhood, r.neighborhoodAr), status?.text].filter(Boolean).join(" · ");
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className="hidden lg:block"
    >
      <Link
        href={href(`/r/${r.slug}`)}
        className="group block rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-4"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-soft shadow-float">
          <RestaurantImage restaurant={r} width={800} className="transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
          <span className="absolute start-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-plum shadow-sm">{t.site.hero.pick}</span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4 px-1">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-plum">{pick(r.name, r.nameAr)}</p>
            <p className="truncate text-sm text-muted">{meta}</p>
          </div>
          {r.rating !== undefined && (
            <span className="flex shrink-0 items-center gap-1 pt-1 text-sm font-semibold text-plum">
              <Star className="h-3.5 w-3.5 fill-tomato text-tomato" aria-hidden />
              {r.rating.toFixed(1)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
