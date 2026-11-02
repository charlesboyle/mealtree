"use client";

import { ArrowLeft, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SaveButton } from "@/components/save-button";
import { useI18n } from "@/i18n/client";
import { useOpenState } from "@/lib/use-open-state";
import type { Restaurant } from "@/lib/types";

const icon =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

/** Compact phone bar that appears once the hero has scrolled away: back, name, search, save. */
export function MenuTopBar({
  restaurant: r,
  visible,
  query,
  onQueryChange,
}: {
  restaurant: Restaurant;
  visible: boolean;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const { t, pick, href, cuisines } = useI18n();
  const [searching, setSearching] = useState(false);
  const name = pick(r.name, r.nameAr);
  const status = useOpenState(r);
  const meta = [cuisines(r.cuisine), pick(r.neighborhood, r.neighborhoodAr)]
    .filter(Boolean)
    .join(" · ");

  const shown = visible || searching;
  // Always mounted under the hero (which has a higher z-index), so scrolling the hero away simply uncovers
  // the bar; its contents switch on instantly (no fade, which read as an empty bar) while still hidden behind the hero.
  return (
    <div className="fixed inset-x-0 top-0 z-40 h-12 bg-cream md:hidden">
      <div
        inert={!shown}
        className={`flex h-full items-center gap-1 px-2 ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <Link
          href={href("/")}
          aria-label={t.menu.allRestaurants}
          className={icon}
        >
          <ArrowLeft
            className="h-[18px] w-[18px] rtl:-scale-x-100"
            aria-hidden
          />
        </Link>
        {searching ? (
          <>
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t.menu.searchPlaceholder(name)}
              aria-label={t.menu.searchLabel}
              enterKeyHint="search"
              className="h-9 min-w-0 flex-1 rounded-full bg-soft px-4 text-base text-ink placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                setSearching(false);
              }}
              aria-label={t.common.cancel}
              className={icon}
            >
              <X className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1 px-1">
              <p className="truncate text-sm font-semibold leading-tight text-ink">
                {name}
              </p>
              <p
                className={`truncate text-[11px] leading-tight ${status?.open ? "text-fresh" : "text-muted"}`}
              >
                {status ? status.text : meta}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearching(true)}
              aria-label={t.menu.searchLabel}
              className={icon}
            >
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <SaveButton slug={r.slug} name={name} variant="plain" />
          </>
        )}
      </div>
    </div>
  );
}
