"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Search, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AreaSelect } from "@/components/area-select";
import { useI18n } from "@/i18n/client";
import { ALL_AREAS } from "@/lib/discover";
import { photoUrl } from "@/lib/format";
import { MOODS } from "@/lib/moods";
import { matchIndexed } from "@/lib/search-index";
import { announceDish, releaseSearchProxy } from "@/lib/search-events";
import { useRotatingPlaceholder } from "@/lib/use-rotating-placeholder";
import { useSearchIndex } from "@/lib/use-search-index";

const EASE = [0.23, 1, 0.32, 1] as const;

/** Full-screen phone search with the field anchored at the bottom, near the thumb. */
export function SearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, pick, href } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setQuery("");
  }
  const [area, setArea] = useState(ALL_AREAS);
  const index = useSearchIndex(open);
  const cue = useRotatingPlaceholder(!open || query.length > 0);

  const areas = useMemo(() => {
    const seen = new Map<string, string | undefined>();
    for (const r of index) if (!seen.has(r.neighborhood)) seen.set(r.neighborhood, r.neighborhoodAr);
    return [...seen].map(([name, nameAr]) => ({ name, nameAr })).sort((a, b) => a.name.localeCompare(b.name));
  }, [index]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      releaseSearchProxy();
    }, 80);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const results = useMemo(
    () =>
      query.trim()
        ? index
            .filter((r) => area === ALL_AREAS || r.neighborhood === area)
            .map((r) => matchIndexed(r, query))
            .filter((m) => m !== null)
            .slice(0, 8)
        : [],
    [index, query, area],
  );

  const withArea = (path: string) => (area === ALL_AREAS ? path : `${path}&area=${encodeURIComponent(area)}`);
  const go = (path: string) => {
    onClose();
    router.push(href(path));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={t.site.search}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="fixed inset-0 z-50 flex flex-col bg-cream/95 backdrop-blur-xl md:hidden"
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))]">
              <AreaSelect value={area} onChange={setArea} areas={areas} className="h-10 rounded-full bg-plum/[0.05] px-3.5" />
              <span className="text-xs text-muted">{results.length > 0 && t.site.sheet.found(results.length)}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-4 pb-3 pt-6">
              {query.trim() === "" ? (
                <div>
                  <p className="text-xs font-semibold text-muted">{t.site.sheet.moods}</p>
                  <div className="mt-3 grid grid-cols-4 gap-y-4">
                    {MOODS.slice(1, 9).map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => go(withArea(`/restaurants?mood=${id}`))}
                        className="flex flex-col items-center gap-2 rounded-xl py-2 text-plum active:bg-soft"
                      >
                        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                        <span className="text-xs font-medium">{t.site.moods[id as keyof typeof t.site.moods]}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-6 text-xs font-semibold text-muted">{t.site.sheet.try}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.site.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQuery(s)}
                        className="h-9 rounded-full bg-plum/[0.05] px-4 text-sm font-medium text-plum active:bg-plum/[0.1]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <ul>
                  {results.map(({ restaurant: r, dish }) => (
                    <li key={r.slug}>
                      <Link
                        href={href(dish ? `/r/${r.slug}#dish-${dish.id}` : `/r/${r.slug}`)}
                        onClick={() => {
                          onClose();
                          if (dish) announceDish(r.slug, dish.id);
                        }}
                        className="flex items-center gap-3 py-3 active:opacity-70"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {r.cover ? <img src={photoUrl(r.cover, 96)} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <span className="h-12 w-12 shrink-0 rounded-xl bg-soft" />}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-plum">{pick(r.name, r.nameAr)}</span>
                          <span className="block truncate text-[13px] text-muted">
                            {dish
                              ? `${t.site.card.has} ${pick(dish.name, dish.nameAr)}`
                              : `${r.cuisine.slice(0, 1).join("")}${r.cuisine.length ? " · " : ""}${pick(r.neighborhood, r.neighborhoodAr)}`}
                          </span>
                        </span>
                        {r.rating !== undefined && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-plum">
                            <Star className="h-3 w-3 fill-tomato text-tomato" aria-hidden />
                            {r.rating.toFixed(1)}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pb-6 text-center text-sm text-muted">{t.site.sheet.noMatches(query)}</p>
              )}
            </div>

            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim()) go(withArea(`/restaurants?q=${encodeURIComponent(query.trim())}`));
              }}
              className="flex items-center gap-2 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3"
            >
              <label className="relative flex-1">
                <span className="sr-only">{t.site.search}</span>
                <Search className="pointer-events-none absolute start-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={cue}
                  enterKeyHint="search"
                  className="h-12 w-full rounded-full bg-plum/[0.06] ps-11 pe-10 text-base text-plum placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={t.site.sheet.clear}
                    className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>
              {query.trim() ? (
                <button
                  type="submit"
                  aria-label={t.site.sheet.seeAll}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tomato text-white active:scale-95"
                >
                  <ArrowUpRight className="h-5 w-5 rtl:-scale-x-100" />
                </button>
              ) : (
                <button type="button" onClick={onClose} className="h-12 shrink-0 px-2 text-sm font-semibold text-plum">
                  {t.site.sheet.cancel}
                </button>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
