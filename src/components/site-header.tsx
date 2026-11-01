"use client";

import { AnimatePresence, motion } from "motion/react";
import { Heart, Search, Store, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/logo";
import { useI18n } from "@/i18n/client";
import { openSearch } from "@/lib/search-events";
import { useRotatingPlaceholder } from "@/lib/use-rotating-placeholder";
import { useHeroPast } from "@/lib/hero-state";
import { useRoute } from "@/lib/use-route";
import { useSaved } from "@/lib/saved";

const EASE = [0.23, 1, 0.32, 1] as const;

/** Sticky top bar. The search field appears once the hero's own field scrolls away; the language toggle sits beside the owner link. */
export function SiteHeader({ languageToggle }: { languageToggle?: React.ReactNode }) {
  const { t, href } = useI18n();
  const route = useRoute();
  const { slugs } = useSaved();
  const onDiscover = route === "/";
  const onList = route === "/restaurants";
  const onRestaurant = route.startsWith("/r/");
  const scrolled = useHeroPast();
  const savedCount = slugs.length;
  const showSearch = !onDiscover || scrolled;
  const tinted = onDiscover && !scrolled;

  return (
    <header
      className={`sticky top-0 z-40 border-b border-line/70 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-200 ${
        onDiscover ? (tinted ? "bg-paper" : "bg-surface") : onList ? "bg-cream/90" : "bg-surface/90"
      } ${onRestaurant ? "hidden md:block" : ""}`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6 md:h-16 lg:px-8">
        <Link
          href={href("/")}
          aria-label={t.site.home}
          className="shrink-0 rounded-lg pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Wordmark className="h-4" />
        </Link>
        <div className="relative flex h-10 min-w-0 flex-1 items-center md:max-w-sm">
          <Suspense fallback={null}>
            <AnimatePresence initial={false}>{showSearch && <HeaderSearch key="search" onList={onList} onDiscover={onDiscover} scrolled={scrolled} />}</AnimatePresence>
          </Suspense>
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {languageToggle}
          <Link
            href={href("/saved")}
            className="hidden h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink md:flex"
          >
            <Heart className="h-4 w-4" aria-hidden />
            {t.site.saved}
            {savedCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
                {savedCount}
              </span>
            )}
          </Link>
          <Link
            href={href("/for-restaurants")}
            aria-label={t.site.forOwners}
            title={t.site.forOwners}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
              route === "/for-restaurants" ? "text-tomato" : "text-plum hover:bg-soft"
            }`}
          >
            <Store className="h-5 w-5" strokeWidth={1.9} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeaderSearch({ onList, onDiscover, scrolled }: { onList: boolean; onDiscover: boolean; scrolled: boolean }) {
  const { t, href } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const urlQuery = onList ? (params.get("q") ?? "") : "";
  const [typed, setTyped] = useState({ from: urlQuery, value: urlQuery });
  // The URL is the source of truth when it changes (back button, clearing from the list page).
  if (typed.from !== urlQuery) setTyped({ from: urlQuery, value: urlQuery });
  const value = typed.value;
  const setValue = (next: string) => setTyped({ from: urlQuery, value: next });
  const [focused, setFocused] = useState(false);
  const cue = useRotatingPlaceholder(focused || value.length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key !== "/" || typing) return;
      e.preventDefault();
      const hero = document.getElementById("hero-search") as HTMLInputElement | null;
      if (onDiscover && !scrolled && hero) hero.focus();
      else inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDiscover, scrolled]);

  /** On the list page, search filters live. Elsewhere it waits for Enter. */
  const change = (next: string) => {
    setValue(next);
    if (!onList) return;
    const p = new URLSearchParams(params.toString());
    if (next) p.set("q", next);
    else p.delete("q");
    router.replace(`${href("/restaurants")}${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onList) router.push(`${href("/restaurants")}${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`);
    inputRef.current?.blur();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="absolute inset-0 ltr:origin-left rtl:origin-right"
    >
      <form role="search" onSubmit={submit} className="relative hidden h-full md:block">
        <label htmlFor="header-search" className="sr-only">
          {t.site.search}
        </label>
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id="header-search"
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              change("");
              e.currentTarget.blur();
            }
          }}
          placeholder={cue}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-10 w-full rounded-full bg-plum/[0.05] ps-10 pe-9 text-sm text-ink placeholder:text-muted transition-colors duration-150 hover:bg-plum/[0.07] focus:bg-plum/[0.07] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              change("");
              inputRef.current?.focus();
            }}
            aria-label={t.common.clearSearch}
            className="absolute end-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
      <button
        type="button"
        onClick={openSearch}
        className="flex h-full w-full items-center gap-2 rounded-full bg-plum/[0.05] px-3.5 text-start text-sm text-muted active:bg-plum/[0.08] md:hidden"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="sr-only">{t.site.searchPrompt}</span>
        {urlQuery ? (
          <span className="truncate text-ink">{urlQuery}</span>
        ) : (
          <span key={cue} className="truncate animate-[cue-in_300ms_ease-out]" aria-hidden>
            {cue}
          </span>
        )}
      </button>
    </motion.div>
  );
}
